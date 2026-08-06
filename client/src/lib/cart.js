// Cart math — pure helpers, mirrored server-side at checkout (server is
// authoritative; this is display only). Grows into full checkout at Milestone 3.

// Line total for a single cart entry (base price + variant delta) × qty.
export function lineTotal(item) {
  const unit = Number(item.price || 0) + Number(item.priceDelta || 0);
  const rawQty = Math.trunc(Number(item.qty));
  const qty = Number.isFinite(rawQty) ? Math.max(0, rawQty) : 0;
  return round2(unit * qty);
}

export function subtotal(items = []) {
  return round2(items.reduce((sum, it) => sum + lineTotal(it), 0));
}

// taxRate is a decimal (0.0875 == 8.75%).
export function taxOf(items, taxRate = 0) {
  return round2(subtotal(items) * Number(taxRate || 0));
}

export function shippingOf(sub, { flatRate = 0, freeThreshold = 0 } = {}) {
  if (freeThreshold > 0 && sub >= freeThreshold) return 0;
  return round2(Number(flatRate || 0));
}

export function orderTotal(items, { taxRate = 0, flatRate = 0, freeThreshold = 0 } = {}) {
  const sub = subtotal(items);
  const tax = taxOf(items, taxRate);
  const ship = shippingOf(sub, { flatRate, freeThreshold });
  return { subtotal: sub, tax, shipping: ship, total: round2(sub + tax + ship) };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
