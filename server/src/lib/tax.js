// Pure tax + address helpers — no DB. Destination tax is resolved from per-state
// rules with a global fallback. (For full multi-jurisdiction tax at scale, swap
// resolveTaxRate for Stripe Tax / a tax API — the callers won't change.)

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]);

// rules: array of { state, rate } (rate = decimal, e.g. 0.0725). Returns the
// destination rate if a rule matches the state, else the global default.
function resolveTaxRate(state, rules = [], defaultRate = 0) {
  const st = String(state || '').toUpperCase().trim();
  if (st) {
    const match = rules.find((r) => String(r.state).toUpperCase().trim() === st);
    if (match) return Number(match.rate) || 0;
  }
  return Number(defaultRate) || 0;
}

// Validate a US shipping address. Returns { errors, value }.
function validateAddress(body = {}) {
  const errors = [];
  const value = { country: 'US', kind: 'shipping' };

  const req = (key, code) => {
    const v = String(body[key] || '').trim();
    if (!v) errors.push(code);
    else value[key] = v;
  };
  req('name', 'name_required');
  req('line1', 'line1_required');
  req('city', 'city_required');
  req('postal_code', 'postal_code_required');

  const state = String(body.state || '').toUpperCase().trim();
  if (!state) errors.push('state_required');
  else if (!US_STATES.has(state)) errors.push('invalid_state');
  else value.state = state;

  value.line2 = body.line2 ? String(body.line2).trim() : null;
  return { errors, value };
}

module.exports = { resolveTaxRate, validateAddress, US_STATES };
