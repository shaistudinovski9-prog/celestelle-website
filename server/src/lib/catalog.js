// Pure catalog helpers — no DB, unit-testable. Route handlers stay thin and
// call these for slug generation, money normalization, and input validation.

// URL-safe slug from a title: lowercase, alphanumerics + single hyphens.
function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accent marks
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Money → non-negative number rounded to cents. Returns null on invalid input
// (caller decides whether that's an error or a default).
function normalizeMoney(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Non-negative integer stock. Invalid → null.
function normalizeStock(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

// Signed money delta (variants can be cheaper or pricier than the base).
function normalizeDelta(value) {
  if (value === '' || value == null) return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Validate + normalize a product create/update body.
// Returns { errors: string[], value: {...} }. On update, pass { partial: true }
// so unspecified fields are simply omitted rather than defaulted.
function validateProduct(body = {}, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) errors.push('title_required');
    else value.title = title;
  }

  if (body.slug !== undefined && body.slug !== '') {
    const slug = slugify(body.slug);
    if (!slug) errors.push('invalid_slug');
    else value.slug = slug;
  }

  if (!partial || body.price !== undefined) {
    const price = normalizeMoney(body.price);
    if (price == null) errors.push('invalid_price');
    else value.price = price;
  }

  if (body.stock_qty !== undefined) {
    const stock = normalizeStock(body.stock_qty);
    if (stock == null) errors.push('invalid_stock');
    else value.stock_qty = stock;
  } else if (!partial) {
    value.stock_qty = 0;
  }

  if (body.description !== undefined) value.description = String(body.description || '');
  if (body.image_url !== undefined) value.image_url = String(body.image_url || '') || null;
  if (body.active !== undefined) value.active = !!body.active;

  return { errors, value };
}

// Validate + normalize a single variant. label required; price_delta signed.
function validateVariant(body = {}) {
  const errors = [];
  const value = {};

  const label = String(body.label || '').trim();
  if (!label) errors.push('variant_label_required');
  else value.label = label;

  const delta = normalizeDelta(body.price_delta);
  if (delta == null) errors.push('invalid_variant_price_delta');
  else value.price_delta = delta;

  const stock = body.stock_qty === undefined ? 0 : normalizeStock(body.stock_qty);
  if (stock == null) errors.push('invalid_variant_stock');
  else value.stock_qty = stock;

  value.sku = body.sku ? String(body.sku).trim() : null;
  value.active = body.active === undefined ? true : !!body.active;
  if (body.id !== undefined) value.id = Number(body.id) || null;

  return { errors, value };
}

module.exports = {
  slugify,
  normalizeMoney,
  normalizeStock,
  normalizeDelta,
  validateProduct,
  validateVariant,
};
