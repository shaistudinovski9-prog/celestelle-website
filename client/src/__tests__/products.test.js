import { describe, test, expect } from 'vitest';
import { effectiveUnitPrice, inStock, priceLabel, formatMoney } from '../lib/products';

describe('effectiveUnitPrice', () => {
  test('base price with no variant', () => {
    expect(effectiveUnitPrice({ price: 24 })).toBe(24);
  });
  test('adds variant delta (signed)', () => {
    expect(effectiveUnitPrice({ price: 24 }, { price_delta: 6 })).toBe(30);
    expect(effectiveUnitPrice({ price: 24 }, { price_delta: -4 })).toBe(20);
  });
});

describe('inStock', () => {
  test('flat product uses its own stock', () => {
    expect(inStock({ stock_qty: 3 })).toBe(true);
    expect(inStock({ stock_qty: 0 })).toBe(false);
  });
  test('a selected variant must have stock and be active', () => {
    expect(inStock({}, { stock_qty: 2, active: true })).toBe(true);
    expect(inStock({}, { stock_qty: 0, active: true })).toBe(false);
    expect(inStock({}, { stock_qty: 5, active: false })).toBe(false);
  });
  test('product with variants is in stock if any active variant has stock', () => {
    const product = { stock_qty: 0, variants: [
      { stock_qty: 0, active: true },
      { stock_qty: 4, active: true },
    ] };
    expect(inStock(product)).toBe(true);
    expect(inStock({ variants: [{ stock_qty: 0, active: true }] })).toBe(false);
  });
});

describe('priceLabel', () => {
  test('single price when no variants', () => {
    expect(priceLabel({ price: 24 })).toBe('$24.00');
  });
  test('range across variant deltas', () => {
    const product = { price: 24, variants: [
      { price_delta: 0, active: true },
      { price_delta: 6, active: true },
    ] };
    expect(priceLabel(product)).toBe('$24.00–$30.00');
  });
  test('collapses to one price when all variants match', () => {
    const product = { price: 24, variants: [
      { price_delta: 0, active: true },
      { price_delta: 0, active: true },
    ] };
    expect(priceLabel(product)).toBe('$24.00');
  });
});

describe('formatMoney', () => {
  test('formats USD', () => {
    expect(formatMoney(19.5)).toBe('$19.50');
    expect(formatMoney(0)).toBe('$0.00');
  });
});
