// Admin order management: list, detail, and the fulfillment transition.
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { validateFulfillInput } = require('../lib/fulfillment');

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/orders — newest first, optional ?payment= / ?fulfillment= filters.
router.get('/', async (req, res) => {
  const clauses = [];
  const params = [];
  if (req.query.payment) { params.push(req.query.payment); clauses.push(`payment_status = $${params.length}`); }
  if (req.query.fulfillment) { params.push(req.query.fulfillment); clauses.push(`fulfillment_status = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT id, order_number, customer_email, total, payment_status, fulfillment_status,
            tracking_number, created_at
       FROM orders ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT 200`,
    params
  );
  res.json(rows);
});

// GET /api/admin/orders/:id — full order with items + shipping address.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const { rows: items } = await db.query(
    'SELECT id, product_id, variant_id, title, qty, unit_price, line_total FROM order_items WHERE order_id = $1 ORDER BY id',
    [id]
  );
  const { rows: addrs } = await db.query(
    "SELECT * FROM addresses WHERE order_id = $1 AND kind = 'shipping' LIMIT 1", [id]
  );
  res.json({ ...rows[0], items, shipping_address: addrs[0] || null });
});

// PUT /api/admin/orders/:id/fulfill — advance fulfillment + set tracking.
// Sends a shipment email (fire-and-forget) when the order first reaches 'shipped'.
router.put('/:id/fulfill', async (req, res) => {
  const id = Number(req.params.id);
  const { rows: cur } = await db.query(
    'SELECT id, order_number, customer_email, fulfillment_status FROM orders WHERE id = $1', [id]
  );
  if (!cur[0]) return res.status(404).json({ error: 'not_found' });

  const { errors, value } = validateFulfillInput(req.body, cur[0].fulfillment_status);
  if (errors.length) return res.status(400).json({ error: 'validation', details: errors });

  const becomingShipped = value.status === 'shipped' && cur[0].fulfillment_status !== 'shipped';

  const sets = ['fulfillment_status = $1'];
  const params = [value.status];
  if (value.tracking_number !== undefined) { params.push(value.tracking_number); sets.push(`tracking_number = $${params.length}`); }
  if (value.tracking_url !== undefined) { params.push(value.tracking_url); sets.push(`tracking_url = $${params.length}`); }
  if (becomingShipped) sets.push('shipped_at = NOW()');
  params.push(id);
  await db.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${params.length}`, params);

  const { rows: updated } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);

  if (becomingShipped) {
    // Fire-and-forget — never block the admin response on email delivery.
    void (async () => {
      try {
        const mailer = require('../services/mailer');
        await mailer.sendShipmentNotice({
          order: updated[0],
          tracking: { tracking_number: updated[0].tracking_number, tracking_url: updated[0].tracking_url },
        });
      } catch (err) {
        console.error('[adminOrders] shipment email error:', err.message);
      }
    })();
  }

  res.json(updated[0]);
});

module.exports = router;
