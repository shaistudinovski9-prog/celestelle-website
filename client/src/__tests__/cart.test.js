import { describe, test, expect } from 'vitest';
import {
  lineTotal, subtotal, taxOf, shippingOf, orderTotal,
  lineKey, cartAdd, cartSetQty, cartRemove, cartCount, toCheckoutItems,
} from '../lib/cart';

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

describe('cart mutations', () => {
  const A = { product_id: 1, variant_id: null, price: 10 };
  const Av = { product_id: 1, variant_id: 21, price: 10, priceDelta: 5 };

  test('lineKey distinguishes variants of the same product', () => {
    expect(lineKey(A)).toBe('1:');
    expect(lineKey(Av)).toBe('1:21');
  });

  test('cartAdd appends new lines and merges quantity for matching lines', () => {
    let items = cartAdd([], A);
    expect(cartCount(items)).toBe(1);
    items = cartAdd(items, A, 2);          // same line → merge
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(3);
    items = cartAdd(items, Av);            // different variant → new line
    expect(items).toHaveLength(2);
    expect(cartCount(items)).toBe(4);
  });

  test('cartSetQty updates, and removes when qty hits 0', () => {
    let items = cartAdd([], A, 3);
    items = cartSetQty(items, '1:', 5);
    expect(items[0].qty).toBe(5);
    items = cartSetQty(items, '1:', 0);
    expect(items).toHaveLength(0);
  });

  test('cartRemove drops the matching line', () => {
    const items = cartAdd(cartAdd([], A), Av);
    expect(cartRemove(items, '1:21')).toHaveLength(1);
  });

  test('toCheckoutItems sends only identity + qty (never client prices)', () => {
    const items = cartAdd(cartAdd([], A, 2), Av, 1);
    expect(toCheckoutItems(items)).toEqual([
      { product_id: 1, variant_id: null, qty: 2 },
      { product_id: 1, variant_id: 21, qty: 1 },
    ]);
  });
});
