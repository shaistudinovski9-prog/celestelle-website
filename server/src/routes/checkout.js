// Checkout: create a Stripe Checkout Session (server-authoritative pricing),
// poll its status, and handle the signed webhook. Fulfillment is idempotent and
// shared with the poll via services/orderFulfillment.
const express = require('express');
const db = require('../db');
const settingsCache = require('../settingsCache');
const { checkoutEnabled } = require('../config/featureFlags');
const { getStripe } = require('../lib/stripeClient');
const { resolveLines, computeTotals, formatOrderNumber } = require('../lib/orders');
const { finalizeOrderPaid } = require('../services/orderFulfillment');

const router = express.Router();

function publicUrl() {
  return (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
}

// Load the products referenced by the cart, with their variants, into a map.
async function loadProductsForCart(items) {
  const ids = [...new Set(items.map((i) => Number(i.product_id)).filter(Boolean))];
  if (!ids.length) return new Map();
  const { rows: products } = await db.query(
    `SELECT id, title, price, stock_qty, active FROM products WHERE id = ANY($1)`, [ids]
  );
  const { rows: variants } = await db.query(
    `SELECT id, product_id, label, price_delta, stock_qty, active
       FROM product_variants WHERE product_id = ANY($1)`, [ids]
  );
  const byId = new Map();
  for (const p of products) byId.set(p.id, { ...p, variants: [] });
  for (const v of variants) byId.get(v.product_id)?.variants.push(v);
  return byId;
}

// POST /api/checkout — create the order (pending) + Stripe session.
router.post('/', async (req, res) => {
  if (!checkoutEnabled()) return res.status(503).json({ error: 'checkout_disabled' });
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'payments_unconfigured' });

  const items = req.body?.items;
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'email_required' });

  const productsById = await loadProductsForCart(Array.isArray(items) ? items : []);
  const { errors, lines } = resolveLines(items, productsById);
  if (errors.length) return res.status(400).json({ error: 'cart_invalid', details: errors });

  const s = await settingsCache.getSettings();
  const totals = computeTotals(lines, {
    taxRate: settingsCache.toNum(s.tax_rate, 0),
    flatRate: settingsCache.toNum(s.ship_flat_rate, 0),
    freeThreshold: settingsCache.toNum(s.free_ship_threshold, 0),
  });
  const currency = (s.currency || 'USD').toLowerCase();

  const client = await db.getClient();
  let orderId, orderNumber;
  try {
    await client.query('BEGIN');
    const { rows: seq } = await client.query("SELECT nextval('order_number_seq') AS n");
    orderNumber = formatOrderNumber(seq[0].n);
    const { rows: cust } = await client.query(
      `INSERT INTO customers (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`, [email]
    );
    const { rows: ord } = await client.query(
      `INSERT INTO orders (order_number, customer_id, customer_email, subtotal, tax, tax_rate,
                           shipping, total, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id`,
      [orderNumber, cust[0].id, email, totals.subtotal, totals.tax, totals.tax_rate,
       totals.shipping, totals.total]
    );
    orderId = ord[0].id;
    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, title, qty, unit_price, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orderId, l.product_id, l.variant_id, l.title, l.qty, l.unit_price, l.line_total]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Build Stripe line items from the SERVER-computed lines (+ shipping as its own line).
  const stripeLineItems = lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency,
      unit_amount: Math.round(l.unit_price * 100),
      product_data: { name: l.title },
    },
  }));
  if (totals.shipping > 0) {
    stripeLineItems.push({
      quantity: 1,
      price_data: { currency, unit_amount: Math.round(totals.shipping * 100),
        product_data: { name: 'Shipping' } },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: stripeLineItems,
    // Tax is already included as computed; for destination tax use Stripe Tax at M5.
    metadata: { order_id: String(orderId), order_number: orderNumber },
    shipping_address_collection: { allowed_countries: ['US'] },
    success_url: `${publicUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicUrl()}/checkout/cancel?order=${encodeURIComponent(orderNumber)}`,
  });

  await db.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [session.id, orderId]);
  res.json({ url: session.url, order_number: orderNumber });
});

// GET /api/checkout/session/:id/status — poll Stripe; finalize if paid (idempotent).
router.get('/session/:id/status', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'payments_unconfigured' });

  const session = await stripe.checkout.sessions.retrieve(req.params.id);
  const orderId = Number(session.metadata?.order_id);
  if (session.payment_status === 'paid' && orderId) {
    await finalizeOrderPaid(orderId, { processorRef: session.payment_intent || session.id });
  }
  const { rows } = await db.query(
    'SELECT order_number, payment_status, total FROM orders WHERE id = $1', [orderId]
  );
  res.json({
    payment_status: session.payment_status,
    order: rows[0] || null,
  });
});

// POST /api/checkout/webhook — raw body; signature-verified. Registered with
// express.raw in app.js BEFORE express.json so the signature stays valid.
async function webhookHandler(req, res) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return res.status(503).json({ error: 'payments_unconfigured' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
  } catch (err) {
    return res.status(400).json({ error: 'invalid_signature', message: err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = Number(session.metadata?.order_id);
    if (session.payment_status === 'paid' && orderId) {
      await finalizeOrderPaid(orderId, { processorRef: session.payment_intent || session.id });
    }
  }
  res.json({ received: true });
}

module.exports = { router, webhookHandler };
