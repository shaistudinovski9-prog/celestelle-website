// US state codes for the shipping address selector.
export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

// Client-side shipping validation (mirrors server lib/tax.validateAddress).
export function validateShipping(a = {}) {
  const missing = [];
  for (const f of ['name', 'line1', 'city', 'state', 'postal_code']) {
    if (!String(a[f] || '').trim()) missing.push(f);
  }
  if (a.state && !US_STATES.includes(String(a.state).toUpperCase())) missing.push('state');
  return missing;
}
