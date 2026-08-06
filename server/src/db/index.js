// Postgres pool + boot-time schema runner.
// Harvested and simplified from Royal Bee OS's db/index.js — same discipline
// (bounded connection/statement timeouts, session settings) without the salon
// advisory-lock machinery we don't need yet.
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const SSL_CONFIG = process.env.NODE_ENV === 'production'
  ? false
  : process.env.DATABASE_URL?.includes('.render.com')
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: SSL_CONFIG,
  connectionTimeoutMillis: 30_000,
  max: 15,
});

// Fail fast instead of hanging forever — the exact lesson RBOS learned the hard way.
pool.on('connect', async client => {
  try {
    await client.query(
      "SET lock_timeout = '5s'; " +
      "SET idle_in_transaction_session_timeout = '60s'; " +
      "SET statement_timeout = '120s'"
    );
  } catch (err) {
    console.error('Session settings error:', err.message);
  }
});

// Run every migrations/*.sql in order. Files are idempotent (IF NOT EXISTS).
async function runMigrations() {
  const dir = path.join(__dirname, '../../migrations');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    console.log(`  ✓ migration ${file}`);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  runMigrations,
  pool,
};
