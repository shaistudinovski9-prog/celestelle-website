const { STATES, isValidState, nextState, canTransition, validateFulfillInput } = require('../lib/fulfillment');

describe('fulfillment states', () => {
  test('known lifecycle order', () => {
    expect(STATES).toEqual(['unfulfilled', 'packed', 'shipped', 'delivered']);
    expect(isValidState('shipped')).toBe(true);
    expect(isValidState('lost')).toBe(false);
  });

  test('nextState advances and stops at the end', () => {
    expect(nextState('unfulfilled')).toBe('packed');
    expect(nextState('packed')).toBe('shipped');
    expect(nextState('shipped')).toBe('delivered');
    expect(nextState('delivered')).toBeNull();
    expect(nextState('bogus')).toBeNull();
  });

  test('canTransition allows forward + same, blocks backward + unknown', () => {
    expect(canTransition('unfulfilled', 'shipped')).toBe(true);   // forward skip ok
    expect(canTransition('packed', 'packed')).toBe(true);         // idempotent
    expect(canTransition('shipped', 'packed')).toBe(false);       // backward blocked
    expect(canTransition('unfulfilled', 'lost')).toBe(false);     // unknown target
  });
});

describe('validateFulfillInput', () => {
  test('accepts a valid forward move with tracking', () => {
    const { errors, value } = validateFulfillInput(
      { status: 'shipped', tracking_number: ' 1Z999 ', tracking_url: 'http://track/1' }, 'packed'
    );
    expect(errors).toEqual([]);
    expect(value).toEqual({ status: 'shipped', tracking_number: '1Z999', tracking_url: 'http://track/1' });
  });

  test('rejects an unknown status', () => {
    expect(validateFulfillInput({ status: 'lost' }, 'packed').errors).toContain('invalid_status');
  });

  test('rejects a backward transition', () => {
    expect(validateFulfillInput({ status: 'unfulfilled' }, 'shipped').errors).toContain('illegal_transition');
  });

  test('blank tracking normalizes to null', () => {
    const { value } = validateFulfillInput({ status: 'packed', tracking_number: '  ' }, 'unfulfilled');
    expect(value.tracking_number).toBeNull();
  });
});
