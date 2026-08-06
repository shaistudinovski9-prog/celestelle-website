// Pure product/variant display helpers (mirrors server catalog math; server is
// authoritative at checkout). Unit-tested; no React, no network.

// Unit price for a product with an optionally-selected variant.
export function effectiveUnitPrice(product, variant = null) {
  const base = Number(product?.price || 0);
  const delta = Number(variant?.price_delta || 0);
  return round2(base + delta);
}

// Is this specific buy option purchasable right now?
export function inStock(product, variant = null) {
  if (variant) return Number(variant.stock_qty || 0) > 0 && variant.active !== false;
  const variants = product?.variants || [];
  if (variants.length) return variants.some(v => v.active !== false && Number(v.stock_qty || 0) > 0);
  return Number(product?.stock_qty || 0) > 0;
}

// Price range label for a product card: single price, or "$X–$Y" across variants.
export function priceLabel(product) {
  const variants = (product?.variants || []).filter(v => v.active !== false);
  if (!variants.length) return formatMoney(product?.price);
  const prices = variants.map(v => effectiveUnitPrice(product, v));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)}–${formatMoney(max)}`;
}

export function formatMoney(value, currency = 'USD') {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
