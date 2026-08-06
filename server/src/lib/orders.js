// Pure order math — no DB, no Stripe, fully unit-testable. The checkout route
// resolves cart input against authoritative DB rows and then calls these.

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Resolve raw cart input against server-side product/variant rows.
// clientItems: [{ product_id, variant_id?, qty }]
// productsById: Map|object of productId -> { id, title, price, stock_qty, active, variants: [...] }
// Returns { errors: string[], lines: [{ product_id, variant_id, title, qty, unit_price, line_total }] }.
// PRICES COME FROM THE SERVER ROWS ONLY — any price/total the client sends is ignored.
function resolveLines(clientItems, productsById) {
  const errors = [];
  const lines = [];
  const get = (id) => (productsById instanceof Map ? productsById.get(id) : productsById[id]);

  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    return { errors: ['empty_cart'], lines: [] };
  }

  for (const item of clientItems) {
    const product = get(Number(item.product_id));
    if (!product || product.active === false) { errors.push(`unavailable:${item.product_id}`); continue; }

    const qty = Math.trunc(Number(item.qty));
    if (!Number.isFinite(qty) || qty <= 0) { errors.push(`invalid_qty:${item.product_id}`); continue; }

    const variants = (product.variants || []).filter((v) => v.active !== false);
    let variant = null;
    if (variants.length) {
      if (item.variant_id == null) { errors.push(`variant_required:${item.product_id}`); continue; }
      variant = variants.find((v) => Number(v.id) === Number(item.variant_id));
      if (!variant) { errors.push(`variant_unavailable:${item.variant_id}`); continue; }
    } else if (item.variant_id != null) {
      errors.push(`no_variants:${item.product_id}`); continue;
    }

    const available = variant ? Number(variant.stock_qty) : Number(product.stock_qty);
    if (qty > available) { errors.push(`insufficient_stock:${item.product_id}`); continue; }

    const unit_price = round2(Number(product.price) + Number(variant?.price_delta || 0));
    lines.push({
      product_id: product.id,
      variant_id: variant ? variant.id : null,
      title: variant ? `${product.title} — ${variant.label}` : product.title,
      qty,
      unit_price,
      line_total: round2(unit_price * qty),
    });
  }

  return { errors, lines };
}

// Totals from resolved lines + store settings. taxRate is a decimal (0.0875).
function computeTotals(lines, { taxRate = 0, flatRate = 0, freeThreshold = 0 } = {}) {
  const subtotal = round2(lines.reduce((s, l) => s + Number(l.line_total), 0));
  const tax = round2(subtotal * Number(taxRate || 0));
  const shipping = (freeThreshold > 0 && subtotal >= freeThreshold) ? 0 : round2(Number(flatRate || 0));
  const total = round2(subtotal + tax + shipping);
  return { subtotal, tax, tax_rate: Number(taxRate || 0), shipping, total };
}

// Friendly, sequential order number from a sequence value.
function formatOrderNumber(n) {
  return `CEL-${String(n).padStart(5, '0')}`;
}

// Idempotent finalize decision — pure. Given the current order row, decide
// whether to record payment. Keeps the ledger invariant: payment == total,
// amount_paid == total. Returns { skip:true } if the order is already paid.
function planFinalize(order, { method = 'stripe' } = {}) {
  if (!order) return { skip: true, reason: 'missing' };
  if (order.payment_status === 'paid') return { skip: true, reason: 'already_paid' };
  const amount = round2(Number(order.total));
  return {
    skip: false,
    payment: { amount, method },
    order: { amount_paid: amount, payment_status: 'paid' },
  };
}

module.exports = { resolveLines, computeTotals, formatOrderNumber, planFinalize, round2 };
