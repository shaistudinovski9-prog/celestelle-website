// Product + variant routes.
//   Public:  GET /            (active products, with active variants)
//            GET /:slug       (one active product + variants)
//   Admin:   GET /admin/all   (all products incl. inactive)
//            GET /admin/:id
//            POST /           (create product + optional variants)
//            PUT /:id         (update scalar fields + replace-all variants)
//            DELETE /:id      (soft delete → active=false)
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { slugify, validateProduct, validateVariant } = require('../lib/catalog');

const router = express.Router();

// ---- helpers ----------------------------------------------------------------

async function loadVariants(productId, { activeOnly = false } = {}) {
  const { rows } = await db.query(
    `SELECT id, product_id, sku, label, price_delta, stock_qty, active
       FROM product_variants
      WHERE product_id = $1 ${activeOnly ? 'AND active = TRUE' : ''}
      ORDER BY id`,
    [productId]
  );
  return rows;
}

// Guarantee slug uniqueness, auto-suffixing (-2, -3, …). excludeId skips the row
// being updated so a product keeps its own slug.
async function ensureUniqueSlug(client, base, excludeId = null) {
  let candidate = base || 'product';
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await client.query(
      'SELECT id FROM products WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)',
      [candidate, excludeId]
    );
    if (!rows.length) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

// Replace-all variant sync inside a transaction. Variants still referenced by an
// order are deactivated rather than deleted (protects the order ledger).
async function syncVariants(client, productId, incoming) {
  const normalized = [];
  for (const raw of incoming) {
    const { errors, value } = validateVariant(raw);
    if (errors.length) { const e = new Error('invalid_variant'); e.details = errors; throw e; }
    normalized.push(value);
  }

  const { rows: existing } = await client.query(
    'SELECT id FROM product_variants WHERE product_id = $1', [productId]
  );
  const existingIds = new Set(existing.map(r => r.id));
  const keepIds = new Set();

  for (const v of normalized) {
    if (v.id && existingIds.has(v.id)) {
      await client.query(
        `UPDATE product_variants
            SET sku = $1, label = $2, price_delta = $3, stock_qty = $4, active = $5
          WHERE id = $6 AND product_id = $7`,
        [v.sku, v.label, v.price_delta, v.stock_qty, v.active, v.id, productId]
      );
      keepIds.add(v.id);
    } else {
      const { rows } = await client.query(
        `INSERT INTO product_variants (product_id, sku, label, price_delta, stock_qty, active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [productId, v.sku, v.label, v.price_delta, v.stock_qty, v.active]
      );
      keepIds.add(rows[0].id);
    }
  }

  for (const id of existingIds) {
    if (keepIds.has(id)) continue;
    const { rows: refs } = await client.query(
      'SELECT 1 FROM order_items WHERE variant_id = $1 LIMIT 1', [id]
    );
    if (refs.length) {
      await client.query('UPDATE product_variants SET active = FALSE WHERE id = $1', [id]);
    } else {
      await client.query('DELETE FROM product_variants WHERE id = $1', [id]);
    }
  }
}

// ---- public reads -----------------------------------------------------------

router.get('/', async (req, res) => {
  const { rows: products } = await db.query(
    `SELECT id, slug, title, description, price, stock_qty, image_url
       FROM products WHERE active = TRUE ORDER BY created_at DESC, id DESC`
  );
  const out = [];
  for (const p of products) out.push({ ...p, variants: await loadVariants(p.id, { activeOnly: true }) });
  res.json(out);
});

router.get('/:slug', async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, slug, title, description, price, stock_qty, image_url
       FROM products WHERE slug = $1 AND active = TRUE`,
    [req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ ...rows[0], variants: await loadVariants(rows[0].id, { activeOnly: true }) });
});

// ---- admin ------------------------------------------------------------------

router.get('/admin/all', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, slug, title, price, stock_qty, image_url, active, created_at
       FROM products ORDER BY created_at DESC, id DESC`
  );
  res.json(rows);
});

router.get('/admin/:id', requireAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ ...rows[0], variants: await loadVariants(rows[0].id) });
});

router.post('/', requireAdmin, async (req, res) => {
  const { errors, value } = validateProduct(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation', details: errors });

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const baseSlug = value.slug || slugify(value.title);
    const slug = await ensureUniqueSlug(client, baseSlug);
    const { rows } = await client.query(
      `INSERT INTO products (slug, title, description, price, stock_qty, image_url, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [slug, value.title, value.description || '', value.price,
       value.stock_qty ?? 0, value.image_url || null,
       value.active === undefined ? true : value.active]
    );
    const productId = rows[0].id;
    if (Array.isArray(req.body.variants) && req.body.variants.length) {
      await syncVariants(client, productId, req.body.variants);
    }
    await client.query('COMMIT');
    const { rows: created } = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    res.status(201).json({ ...created[0], variants: await loadVariants(productId) });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message === 'invalid_variant') {
      return res.status(400).json({ error: 'validation', details: err.details });
    }
    throw err;
  } finally {
    client.release();
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { errors, value } = validateProduct(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: 'validation', details: errors });

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query('SELECT id, slug FROM products WHERE id = $1', [id]);
    if (!existing[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'not_found' }); }

    if (value.slug || value.title) {
      const base = value.slug || slugify(value.title);
      value.slug = await ensureUniqueSlug(client, base, id);
    }

    const fields = ['title', 'slug', 'description', 'price', 'stock_qty', 'image_url', 'active'];
    const sets = [];
    const params = [];
    for (const f of fields) {
      if (value[f] !== undefined) { params.push(value[f]); sets.push(`${f} = $${params.length}`); }
    }
    if (sets.length) {
      params.push(id);
      await client.query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    }

    if (Array.isArray(req.body.variants)) {
      await syncVariants(client, id, req.body.variants);
    }

    await client.query('COMMIT');
    const { rows: updated } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    res.json({ ...updated[0], variants: await loadVariants(id) });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message === 'invalid_variant') {
      return res.status(400).json({ error: 'validation', details: err.details });
    }
    throw err;
  } finally {
    client.release();
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await db.query(
    'UPDATE products SET active = FALSE WHERE id = $1', [Number(req.params.id)]
  );
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

module.exports = router;
