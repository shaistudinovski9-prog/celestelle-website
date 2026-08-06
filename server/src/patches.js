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

async function applyPatches() {
  for (const sql of COLUMN_PATCHES) {
    await db.query(sql);
  }
  await seedSettings();
  await bootstrapAdmin();
}

module.exports = { applyPatches, DEFAULT_SETTINGS };
