const {
  slugify, normalizeMoney, normalizeStock, normalizeDelta,
  validateProduct, validateVariant,
} = require('../lib/catalog');

describe('slugify', () => {
  test('lowercases and hyphenates', () => {
    expect(slugify('Celestial Glow Serum')).toBe('celestial-glow-serum');
  });
  test('strips accents and punctuation', () => {
    expect(slugify('Naïve Café — 50% Off!')).toBe('naive-cafe-50-off');
  });
  test('trims leading/trailing hyphens and empties safely', () => {
    expect(slugify('  ---  ')).toBe('');
    expect(slugify(null)).toBe('');
  });
});

describe('money/stock normalization', () => {
  test('normalizeMoney rounds to cents, rejects negatives and garbage', () => {
    expect(normalizeMoney('19.999')).toBe(20);
    expect(normalizeMoney(0)).toBe(0);
    expect(normalizeMoney(-1)).toBeNull();
    expect(normalizeMoney('abc')).toBeNull();
    expect(normalizeMoney('')).toBeNull();
  });
  test('normalizeStock requires a non-negative integer', () => {
    expect(normalizeStock('5')).toBe(5);
    expect(normalizeStock(0)).toBe(0);
    expect(normalizeStock('5.5')).toBeNull();
    expect(normalizeStock(-2)).toBeNull();
  });
  test('normalizeDelta allows signed values, defaults blank to 0', () => {
    expect(normalizeDelta('2.5')).toBe(2.5);
    expect(normalizeDelta('-3')).toBe(-3);
    expect(normalizeDelta('')).toBe(0);
    expect(normalizeDelta('nope')).toBeNull();
  });
});

describe('validateProduct', () => {
  test('accepts a full valid product', () => {
    const { errors, value } = validateProduct({
      title: 'Glow Serum', price: '24.00', stock_qty: '10', description: 'Nice',
    });
    expect(errors).toEqual([]);
    expect(value).toMatchObject({ title: 'Glow Serum', price: 24, stock_qty: 10, description: 'Nice' });
  });
  test('flags missing title and bad price', () => {
    const { errors } = validateProduct({ title: '  ', price: -5 });
    expect(errors).toContain('title_required');
    expect(errors).toContain('invalid_price');
  });
  test('normalizes compare_at_price; blank clears it, garbage errors', () => {
    expect(validateProduct({ title: 'X', price: '10', compare_at_price: '15' }).value.compare_at_price).toBe(15);
    expect(validateProduct({ title: 'X', price: '10', compare_at_price: '' }, { partial: true }).value.compare_at_price).toBeNull();
    expect(validateProduct({ title: 'X', price: '10', compare_at_price: 'abc' }).errors).toContain('invalid_compare_at');
  });

  test('partial update omits unspecified fields and does not force defaults', () => {
    const { errors, value } = validateProduct({ price: '30' }, { partial: true });
    expect(errors).toEqual([]);
    expect(value).toEqual({ price: 30 });
    expect(value.stock_qty).toBeUndefined();
  });
});

describe('validateVariant', () => {
  test('requires a label, normalizes delta/stock, defaults active true', () => {
    const { errors, value } = validateVariant({ label: '30ml', price_delta: '5', stock_qty: '3' });
    expect(errors).toEqual([]);
    expect(value).toMatchObject({ label: '30ml', price_delta: 5, stock_qty: 3, active: true, sku: null });
  });
  test('flags missing label', () => {
    const { errors } = validateVariant({ price_delta: '1' });
    expect(errors).toContain('variant_label_required');
  });
  test('carries an existing id through for update', () => {
    const { value } = validateVariant({ id: 7, label: 'Large' });
    expect(value.id).toBe(7);
  });
});
