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

// ---- cart mutation helpers (pure reducers over an items array) --------------

// Stable identity for a cart line: product + chosen variant.
export function lineKey(item) {
  return `${item.product_id}:${item.variant_id ?? ''}`;
}

// Add an item, merging quantity into an existing matching line.
export function cartAdd(items, entry, qty = 1) {
  const addQty = Math.max(1, Math.trunc(Number(qty) || 1));
  const key = lineKey(entry);
  const existing = items.find((it) => lineKey(it) === key);
  if (existing) {
    return items.map((it) => (lineKey(it) === key ? { ...it, qty: it.qty + addQty } : it));
  }
  return [...items, { ...entry, qty: addQty }];
}

// Set an explicit quantity; qty <= 0 removes the line.
export function cartSetQty(items, key, qty) {
  const n = Math.trunc(Number(qty));
  if (!Number.isFinite(n) || n <= 0) return items.filter((it) => lineKey(it) !== key);
  return items.map((it) => (lineKey(it) === key ? { ...it, qty: n } : it));
}

export function cartRemove(items, key) {
  return items.filter((it) => lineKey(it) !== key);
}

export function cartCount(items = []) {
  return items.reduce((n, it) => n + Math.max(0, Math.trunc(Number(it.qty) || 0)), 0);
}

// Shape sent to POST /api/checkout — only identity + qty; the server prices it.
export function toCheckoutItems(items = []) {
  return items.map((it) => ({ product_id: it.product_id, variant_id: it.variant_id ?? null, qty: it.qty }));
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
