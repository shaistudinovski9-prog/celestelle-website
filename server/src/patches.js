// Additive DDL + seeds, run once at boot after migrations.
// Convention (from RBOS): schema changes are ALWAYS additive and idempotent —
// `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Never destructive migrations here.
const bcrypt = require('bcryptjs');
const db = require('./db');

// Default settings — seeded only if absent, so an owner edit is never overwritten.
const DEFAULT_SETTINGS = {
  store_name: 'Celestelle',
  tax_rate: '0',            // decimal rate, e.g. 0.0875 for 8.75%
  tax_label: 'Tax',
  currency: 'USD',
  free_ship_threshold: '0', // 0 = disabled
  ship_flat_rate: '0',
};

// Additive column patches go here as the schema grows (Milestones 2+).
const COLUMN_PATCHES = [
  // M3 — checkout: track the Stripe Checkout Session on the order.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT`,
  // Friendly, sequential customer-facing order numbers (CEL-00001, …).
  `CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1`,
  // M4 — fulfillment: shipment tracking + timestamps on the order.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ`,
  // M5 — destination tax: per-state sales-tax rates (decimal, e.g. 0.0725).
  `CREATE TABLE IF NOT EXISTS tax_rules (
     state TEXT PRIMARY KEY,
     rate  NUMERIC(6,4) NOT NULL DEFAULT 0,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  // Catalog import: product detail fields from the source site.
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use TEXT`,
];

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }
}

// Bootstrap the first admin from env, once, only if no admin exists yet.
async function bootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return;
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM admin_users');
  if (rows[0].n > 0) return;
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO admin_users (email, password_hash, name)
     VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase().trim(), hash, 'Owner']
  );
  console.log(`  ✓ bootstrapped admin: ${email}`);
}

// One-time catalog import from the existing celestellebeauty.com site.
// Guarded by the `catalog_imported` settings flag so it runs exactly once, ever —
// it will not re-seed after the owner edits/deletes products. Idempotent per row
// via ON CONFLICT (slug) DO NOTHING as a second layer of safety.
async function importCatalog() {
  const { rows } = await db.query("SELECT value FROM settings WHERE key = 'catalog_imported'");
  if (rows[0]?.value === 'true') return;

  const { CATALOG } = require('./data/celestelleCatalog');
  let inserted = 0;
  for (const p of CATALOG) {
    const r = await db.query(
      `INSERT INTO products (slug, title, description, price, stock_qty, image_url, active, ingredients, how_to_use)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.title, p.description, p.price, p.stock_qty, p.image_url, p.active, p.ingredients, p.how_to_use]
    );
    inserted += r.rowCount;
  }
  await db.query(
    `INSERT INTO settings (key, value) VALUES ('catalog_imported', 'true')
     ON CONFLICT (key) DO UPDATE SET value = 'true'`
  );
  console.log(`  ✓ catalog import: ${inserted} product(s) seeded`);
}

async function applyPatches() {
  for (const sql of COLUMN_PATCHES) {
    await db.query(sql);
  }
  await seedSettings();
  await bootstrapAdmin();
  await importCatalog();
}

module.exports = { applyPatches, importCatalog, DEFAULT_SETTINGS };
