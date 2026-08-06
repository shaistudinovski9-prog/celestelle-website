const { toNum, toBool } = require('../settingsCache');

describe('settings coercion helpers', () => {
  test('toNum parses numeric strings and falls back on garbage', () => {
    expect(toNum('0.0875')).toBeCloseTo(0.0875);
    expect(toNum('12')).toBe(12);
    expect(toNum('not-a-number', 5)).toBe(5);
    expect(toNum(undefined, 0)).toBe(0);
    expect(toNum(null, 3)).toBe(3);
  });

  test('toBool recognizes truthy string forms', () => {
    for (const v of ['1', 'true', 'yes', 'on', 'TRUE', 'On']) {
      expect(toBool(v)).toBe(true);
    }
    for (const v of ['0', 'false', 'no', 'off', '', 'nope']) {
      expect(toBool(v)).toBe(false);
    }
    expect(toBool(undefined, true)).toBe(true);
    expect(toBool(null, false)).toBe(false);
  });
});
