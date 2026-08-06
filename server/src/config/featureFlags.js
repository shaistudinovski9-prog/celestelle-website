// Server-authoritative feature flags / kill switches — read at CALL TIME
// (never cached at module load) so flipping an env var takes effect without a
// restart. Fail-safe defaults. Pattern harvested from RBOS featureFlags.js.

function envBool(name, def = false) {
  const v = process.env[name];
  if (v == null || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

module.exports = {
  // Storefront checkout master switch (Milestone 3). Default ON — the real gate
  // is whether Stripe is configured (the route 503s "payments_unconfigured"
  // without keys). Set CHECKOUT_ENABLED=false as an emergency kill switch.
  checkoutEnabled: () => envBool('CHECKOUT_ENABLED', true),
  // Whether the public storefront is live. Default ON.
  storefrontEnabled: () => envBool('STOREFRONT_ENABLED', true),
  envBool,
};
