const { resolveTaxRate, validateAddress } = require('../lib/tax');

describe('resolveTaxRate', () => {
  const rules = [{ state: 'CA', rate: 0.0725 }, { state: 'ny', rate: 0.04 }];

  test('uses the destination-state rate when a rule matches', () => {
    expect(resolveTaxRate('CA', rules, 0)).toBeCloseTo(0.0725);
    expect(resolveTaxRate('ca', rules, 0)).toBeCloseTo(0.0725); // case-insensitive
    expect(resolveTaxRate('NY', rules, 0)).toBeCloseTo(0.04);   // rule state case-insensitive
  });

  test('falls back to the default rate when no rule matches', () => {
    expect(resolveTaxRate('TX', rules, 0.05)).toBe(0.05);
    expect(resolveTaxRate('', rules, 0.06)).toBe(0.06);
    expect(resolveTaxRate(null, [], 0)).toBe(0);
  });
});

describe('validateAddress', () => {
  const good = { name: 'Jo', line1: '1 Main', city: 'SD', state: 'ca', postal_code: '92101' };

  test('accepts a valid US address and upcases the state', () => {
    const { errors, value } = validateAddress(good);
    expect(errors).toEqual([]);
    expect(value).toMatchObject({ name: 'Jo', line1: '1 Main', city: 'SD', state: 'CA',
      postal_code: '92101', country: 'US', kind: 'shipping', line2: null });
  });

  test('flags missing required fields', () => {
    const { errors } = validateAddress({ name: '', line1: '', city: '', postal_code: '' });
    expect(errors).toEqual(expect.arrayContaining(
      ['name_required', 'line1_required', 'city_required', 'postal_code_required', 'state_required']));
  });

  test('rejects an unknown state code', () => {
    expect(validateAddress({ ...good, state: 'ZZ' }).errors).toContain('invalid_state');
  });
});
