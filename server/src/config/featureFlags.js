// Server-authoritative feature flags / kill switches — read at CALL TIME
// (never cached at module load) so flipping an env var takes effect without a
// restart. Fail-safe defaults. Pattern harvested from RBOS featureFlags.js.

function envBool(name, def = false) {
  const v = process.env[name];
  if (v == null || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

module.exports = {
  // Storefront checkout master switch (Milestone 3). Default OFF until Stripe is wired.
  checkoutEnabled: () => envBool('CHECKOUT_ENABLED', false),
  // Whether the public storefront is live. Default ON.
  storefrontEnabled: () => envBool('STOREFRONT_ENABLED', true),
  envBool,
};
