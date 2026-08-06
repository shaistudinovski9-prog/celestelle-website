import { describe, test, expect } from 'vitest';
import { US_STATES, validateShipping } from '../lib/usStates';

describe('validateShipping', () => {
  const good = { name: 'Jo', line1: '1 Main St', city: 'San Diego', state: 'CA', postal_code: '92101' };

  test('a complete address passes', () => {
    expect(validateShipping(good)).toEqual([]);
  });
  test('reports each missing required field', () => {
    expect(validateShipping({})).toEqual(
      expect.arrayContaining(['name', 'line1', 'city', 'state', 'postal_code'])
    );
  });
  test('flags an unknown state code', () => {
    expect(validateShipping({ ...good, state: 'ZZ' })).toContain('state');
  });
  test('state list covers 50 states + DC', () => {
    expect(US_STATES).toHaveLength(51);
    expect(US_STATES).toContain('CA');
    expect(US_STATES).toContain('DC');
  });
});
