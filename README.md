# Celestelle Store

Direct-to-consumer online store for **Celestelle** products.
Custom build: React + Vite (client) · Express + PostgreSQL (server) · Stripe checkout.

See [`docs/00-build-plan.md`](docs/00-build-plan.md) for the full architecture, data model,
and milestones.

## Stack

- **client/** — React 18, Vite, react-router, axios. Public storefront + small admin.
- **server/** — Express, `pg` (raw SQL, no ORM), JWT admin auth, Stripe (Milestone 3).
- **Postgres** — base schema in `server/migrations/`, additive DDL in `server/src/patches.js`.

## Getting started

```bash
cp .env.example .env          # fill in DATABASE_URL + JWT_SECRET
npm run install:all           # install root + server + client deps
# create the database, then:
npm run dev                   # server on :4000, client on :5173
```

On boot the server runs `migrations/*.sql` then `patches.js` (additive columns + seeds the
`settings` table and a bootstrap admin from `ADMIN_BOOTSTRAP_*`).

## Tests

```bash
npm test                      # server (jest) + client (vitest)
```

## Conventions (carried from Royal Bee OS)

- **Server-authoritative money** — totals/tax recomputed on the server, client never trusted.
- **Settings over hardcodes** — store name, tax rate, thresholds live in the `settings` table.
- **Additive migrations** — new columns via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `patches.js`.
- **Every money path ships with a test.**
