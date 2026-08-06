# Deploying Celestelle to Render

This store is a **separate Render service from Royal Bee OS** — its own URL and its own
database. It won't appear inside the Royal Bee deployment.

## Why it wasn't showing up in Render

Render's GitHub connection only had access to `royal-bee-os` and `celestelle-beauty`.
This project lives in **`celestelle-website`**, which Render couldn't see. Step 1 below fixes that.

## One-time setup (the parts only you can do in the dashboard)

### 1. Grant Render access to this repo
On the "Create a new Blueprint Instance" screen (or any connect-repo screen), click
**GitHub → Configure account**. In GitHub's dialog, under **Repository access**, add
`shaistudinovski9-prog/celestelle-website` (or choose "All repositories"). Save.
Now `celestelle-website` appears in Render's repo list.

### 2. Create the Blueprint
Render dashboard → **New → Blueprint** → pick `celestelle-website`.
- Render reads `render.yaml` and shows the plan: a **web service** (`celestelle-store`) + a
  **Postgres database** (`celestelle-db`).
- The blueprint tracks the branch named in `render.yaml` (`branch:` field). It's currently
  set to `claude/celestelle-pos-audit-3rzeme`. When you merge to `main`, change that field
  to `main` and push.
- Click **Apply**. Render provisions the DB, then builds and starts the web service.

### 3. Fill in the secret env vars
On the `celestelle-store` service → **Environment**, set the `sync: false` vars:
- `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` — your first admin login (created
  once on first boot; you can change it later).
- `PUBLIC_URL` — after the first deploy Render assigns a URL like
  `https://celestelle-store.onrender.com`. Paste it here (used for Stripe redirect links).
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — optional. Leave blank to launch the
  storefront in browse-only mode; checkout returns `503 payments_unconfigured` until set.
- `DATABASE_URL` and `JWT_SECRET` are wired automatically — don't set them by hand.

### 4. (When ready for payments) point Stripe at the webhook
In the Stripe dashboard, add a webhook endpoint to
`https://<your-service>.onrender.com/api/checkout/webhook`, copy its signing secret into
`STRIPE_WEBHOOK_SECRET`, and redeploy.

## What happens on each deploy

`buildCommand` installs root/server/client deps and builds the client bundle;
`startCommand` runs the Express server, which on boot runs `migrations/*.sql` + `patches.js`
(creating tables, seeding `settings`, bootstrapping the admin) and then serves both the API
and the built storefront from one service. Health check: `/api/health`.

## Notes on the free plans

- **Free web service** spins down after inactivity (first request after idle is slow to wake).
- **Free Postgres** is deleted ~90 days after creation. Upgrade the database plan before you
  rely on it for real orders.
