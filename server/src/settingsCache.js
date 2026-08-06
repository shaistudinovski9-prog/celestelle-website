// In-memory settings cache (60s TTL) — harvested from RBOS.
// All config (store name, tax rate, thresholds) reads through here so nothing
// is hardcoded and a DB round-trip isn't taken on every request.
const db = require('./db');

let cache = null;
let loadedAt = 0;
const TTL_MS = 60_000;

async function load() {
  const { rows } = await db.query('SELECT key, value FROM settings');
  cache = {};
  for (const r of rows) cache[r.key] = r.value;
  loadedAt = Date.now();
  return cache;
}

async function getSettings() {
  if (!cache || Date.now() - loadedAt > TTL_MS) await load();
  return cache;
}

async function get(key, fallback = null) {
  const s = await getSettings();
  return key in s && s[key] != null ? s[key] : fallback;
}

// Coercion helpers — pure given a value, unit-testable without a DB.
function toNum(value, fallback = 0) {
  // Treat absent/blank settings as "use the fallback" — Number(null)/Number('')
  // are 0, which would otherwise mask a missing value with a real zero.
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value, fallback = false) {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

async function num(key, fallback = 0) {
  return toNum(await get(key), fallback);
}

async function bool(key, fallback = false) {
  return toBool(await get(key), fallback);
}

function invalidate() {
  cache = null;
  loadedAt = 0;
}

module.exports = { getSettings, get, num, bool, invalidate, toNum, toBool };
