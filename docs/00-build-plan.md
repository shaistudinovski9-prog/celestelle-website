# Celestelle Store — Build Plan

> **What this is:** the online store that sells Celestelle products direct to customers.
> Built custom (React + Express + Postgres), **harvesting the proven money-path slices**
> from Royal Bee OS (Stripe checkout flow, orders ledger, server-authoritative money,
> settings/feature-flag patterns) while dropping everything salon-specific (till,
> commissions, packages, memberships, appointments, staff register UI).

## Why not fork Royal Bee OS

Royal Bee's "POS" is a **staff-operated, in-store cash register** — an employee rings up a
walk-in, splits commission, reconciles a cash till, redeems prepaid salon packages, links the
sale to an appointment. Celestelle is the opposite shape: a **customer, alone, self-checks-out
online and waits for a box to ship**. Forking the salon app would carry ~70% dead weight and
still leave the ecommerce essentials (storefront, cart, shipping, fulfillment) unbuilt. So we
build fresh and harvest only what genuinely transfers.

## Architecture

```
client/   React 18 + Vite + react-router + axios   → public storefront + small admin
server/   Express + pg (no ORM) + Stripe + webhooks → API + order engine
          Postgres; migrations/*.sql + patches.js additive-DDL convention
```

Two surfaces (unlike RBOS's staff-only app):

- **Storefront** — public, no login to shop.
- **Admin** — token-authed; products + orders + fulfillment.

## Data model

| Table | From RBOS? | Purpose |
|---|---|---|
| `products` | ♻️ adapted | title, slug, description, price, `stock_qty`, active, image_url |
| `product_variants` | 🆕 | SKU, option label (size/scent), price delta, per-variant stock |
| `orders` | ♻️ `sales` slimmed | customer, subtotal, tax, shipping, total, `payment_status`, `fulfillment_status` |
| `order_items` | ♻️ `sale_items` | product/variant, qty, unit price, line total |
| `order_payments` | ♻️ `sale_payments` | Stripe intent/charge ref — keep `Σ payments = amount_paid` invariant |
| `customers` | 🆕 (not staff `users`) | email, name, optional account |
| `addresses` | 🆕 | shipping/billing per order |
| `admin_users` | 🆕 | back-office logins (bcrypt) |
| `settings` | ♻️ | tax rate, ship-from, free-ship threshold, store name |

**Dropped from RBOS:** `sale_splits`, `commission_tiers`, `tills`, `packages`, `memberships`,
`client_package_balances`, `appointments`, `employees`/salon roles, the staff `POSScreen` UI.

## API surface

**Storefront (public)**
- `GET /api/products`, `GET /api/products/:slug`
- `POST /api/checkout` — create Stripe session *(harvest `payments.js`)*
- `POST /api/webhook` — raw-body signature verify *(harvest verbatim pattern)*
- `GET /api/orders/:token` — order lookup by email + number

**Admin (auth)**
- `POST /api/auth/login`, `GET /api/auth/me`
- product CRUD *(harvest `catalog.js`)*
- `GET /api/admin/orders`, `PUT /api/admin/orders/:id/fulfill`

## Engineering discipline (kept from RBOS)

- **Server-authoritative money** — recompute tax/totals server-side; never trust the client.
- **Ledger invariant** — `Σ order_payments = orders.amount_paid`; one test per money path.
- **Settings over hardcodes** — store name, tax rate, thresholds live in `settings`.
- **Feature-flag kill switches** — read at call time, fail-safe defaults.
- **Additive migrations** — `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `patches.js`.

## Milestones

1. **Repo skeleton** ← *this scaffold* — client+server, DB pool, `settings`, `patches.js`, admin auth.
2. **Catalog** — products/variants + admin CRUD + storefront listing/detail.
3. **Cart + Stripe checkout** — session create → webhook confirm → `orders`/`order_payments`.
4. **Fulfillment** — order status, tracking, email confirmation.
5. **Shipping/tax + polish** — rates, destination tax, SEO/meta, launch.

## Status

- [x] Milestone 1 — skeleton, DB layer, settings, admin auth
- [x] Milestone 2 — catalog (products + variants; admin CRUD; storefront grid + detail)
- [ ] Milestone 3 — cart + checkout
- [ ] Milestone 4 — fulfillment
- [ ] Milestone 5 — shipping/tax + polish
