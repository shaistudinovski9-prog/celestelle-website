// Settings routes: public receipt/store settings (GET), admin update (PUT).
const express = require('express');
const db = require('../db');
const settingsCache = require('../settingsCache');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public storefront-safe settings (no secrets). Used to render tax + store name.
router.get('/public', async (req, res) => {
  const s = await settingsCache.getSettings();
  res.json({
    store_name: s.store_name || 'Celestelle',
    tax_rate: settingsCache.toNum(s.tax_rate, 0),
    tax_label: s.tax_label || 'Tax',
    currency: s.currency || 'USD',
    free_ship_threshold: settingsCache.toNum(s.free_ship_threshold, 0),
    ship_flat_rate: settingsCache.toNum(s.ship_flat_rate, 0),
  });
});

// Per-state tax rules — admin only.
router.get('/tax-rules', requireAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT state, rate FROM tax_rules ORDER BY state');
  res.json(rows);
});

// Replace-all tax rules. Body: { rules: [{ state, rate }] }. rate is a decimal.
router.put('/tax-rules', requireAdmin, async (req, res) => {
  const rules = Array.isArray(req.body?.rules) ? req.body.rules : [];
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tax_rules');
    for (const r of rules) {
      const state = String(r.state || '').toUpperCase().trim();
      const rate = Number(r.rate);
      if (!state || !Number.isFinite(rate) || rate < 0) continue;
      await client.query(
        `INSERT INTO tax_rules (state, rate) VALUES ($1, $2)
         ON CONFLICT (state) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW()`,
        [state, rate]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  const { rows } = await db.query('SELECT state, rate FROM tax_rules ORDER BY state');
  res.json(rows);
});

// Full settings map — admin only.
router.get('/', requireAdmin, async (req, res) => {
  res.json(await settingsCache.getSettings());
});

// Update one or more settings — admin only. Additive upsert.
router.put('/', requireAdmin, async (req, res) => {
  const updates = req.body || {};
  const keys = Object.keys(updates);
  if (!keys.length) return res.status(400).json({ error: 'no_updates' });
  for (const key of keys) {
    await db.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, String(updates[key])]
    );
  }
  settingsCache.invalidate();
  res.json(await settingsCache.getSettings());
});

module.exports = router;
