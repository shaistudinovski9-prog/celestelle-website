// Lazy Stripe client. Returns null when STRIPE_SECRET_KEY is unset so the app
// boots and the storefront runs without payments configured — the checkout route
// then responds 503 (payments_unconfigured) instead of crashing.
let cached;

function getStripe() {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { cached = null; return cached; }
  // Require lazily so environments without the dep/key never load it.
  const Stripe = require('stripe');
  cached = new Stripe(key);
  return cached;
}

// Test seam.
function _reset() { cached = undefined; }

module.exports = { getStripe, _reset };
