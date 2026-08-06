-- Celestelle Store — base schema (Milestone 1)
-- Additive columns and seeds live in src/patches.js. Keep this file idempotent.

-- Key/value store config (tax rate, store name, thresholds). Read via settingsCache.
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-office logins (bcrypt). NOT customers — this is admin only.
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storefront customers (created at checkout; account optional). NOT admin_users.
CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sellable products.
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_qty   INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product variants (size/scent/etc). price_delta added to the base product price.
CREATE TABLE IF NOT EXISTS product_variants (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku         TEXT UNIQUE,
  label       TEXT NOT NULL,
  price_delta NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_qty   INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Order header. Money columns are server-computed; client is never trusted.
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  order_number       TEXT UNIQUE NOT NULL,
  customer_id        INTEGER REFERENCES customers(id),
  subtotal           NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax                NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate           NUMERIC(6,4) NOT NULL DEFAULT 0,
  shipping           NUMERIC(10,2) NOT NULL DEFAULT 0,
  total              NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid        NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status     TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | refunded | cancelled
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled', -- unfulfilled | packed | shipped | delivered
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id),
  variant_id  INTEGER REFERENCES product_variants(id),
  title       TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total  NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Per-tender money ledger. Invariant: SUM(order_payments.amount) = orders.amount_paid.
CREATE TABLE IF NOT EXISTS order_payments (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  method        TEXT NOT NULL DEFAULT 'stripe',
  processor_ref TEXT,
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL DEFAULT 'shipping',  -- shipping | billing
  name        TEXT,
  line1       TEXT,
  line2       TEXT,
  city        TEXT,
  state       TEXT,
  postal_code TEXT,
  country     TEXT NOT NULL DEFAULT 'US'
);
