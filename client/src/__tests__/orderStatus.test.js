import { describe, test, expect } from 'vitest';
import { FULFILLMENT_STEPS, nextFulfillment, label, badgeClass } from '../lib/orderStatus';

describe('order status helpers', () => {
  test('lifecycle order', () => {
    expect(FULFILLMENT_STEPS).toEqual(['unfulfilled', 'packed', 'shipped', 'delivered']);
  });
  test('nextFulfillment advances and stops', () => {
    expect(nextFulfillment('unfulfilled')).toBe('packed');
    expect(nextFulfillment('shipped')).toBe('delivered');
    expect(nextFulfillment('delivered')).toBeNull();
  });
  test('label capitalizes, handles empty', () => {
    expect(label('shipped')).toBe('Shipped');
    expect(label('')).toBe('—');
  });
  test('badgeClass maps known statuses', () => {
    expect(badgeClass('paid')).toContain('badge-green');
    expect(badgeClass('shipped')).toContain('badge-blue');
    expect(badgeClass('pending')).toContain('badge-gray');
    expect(badgeClass('refunded')).toContain('badge-red');
  });
});
