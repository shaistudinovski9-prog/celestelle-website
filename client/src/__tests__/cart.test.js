import { describe, test, expect } from 'vitest';
import { lineTotal, subtotal, taxOf, shippingOf, orderTotal } from '../lib/cart';

describe('cart math', () => {
  const items = [
    { price: 20, priceDelta: 0, qty: 2 },   // 40
    { price: 15, priceDelta: 5, qty: 1 },   // 20
  ];

  test('lineTotal applies variant delta and qty', () => {
    expect(lineTotal(items[0])).toBe(40);
    expect(lineTotal(items[1])).toBe(20);
  });

  test('subtotal sums lines', () => {
    expect(subtotal(items)).toBe(60);
  });

  test('taxOf applies a decimal rate', () => {
    expect(taxOf(items, 0.0875)).toBe(5.25);
    expect(taxOf(items, 0)).toBe(0);
  });

  test('shippingOf honors free-ship threshold', () => {
    expect(shippingOf(60, { flatRate: 8, freeThreshold: 50 })).toBe(0);
    expect(shippingOf(40, { flatRate: 8, freeThreshold: 50 })).toBe(8);
    expect(shippingOf(40, { flatRate: 8, freeThreshold: 0 })).toBe(8);
  });

  test('orderTotal composes subtotal + tax + shipping', () => {
    const t = orderTotal(items, { taxRate: 0.0875, flatRate: 8, freeThreshold: 100 });
    expect(t).toEqual({ subtotal: 60, tax: 5.25, shipping: 8, total: 73.25 });
  });

  test('ignores negative/garbage qty', () => {
    expect(lineTotal({ price: 10, qty: -3 })).toBe(0);
    expect(lineTotal({ price: 10, qty: 'x' })).toBe(0);
  });
});
