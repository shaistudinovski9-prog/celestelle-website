const { resolveLines, computeTotals, formatOrderNumber, planFinalize } = require('../lib/orders');

const catalog = {
  1: { id: 1, title: 'Glow Serum', price: 24, stock_qty: 5, active: true, variants: [] },
  2: { id: 2, title: 'Body Oil', price: 20, stock_qty: 0, active: true, variants: [
    { id: 21, product_id: 2, label: '30ml', price_delta: 0, stock_qty: 3, active: true },
    { id: 22, product_id: 2, label: '50ml', price_delta: 6, stock_qty: 0, active: true },
    { id: 23, product_id: 2, label: 'gone', price_delta: 0, stock_qty: 9, active: false },
  ] },
  9: { id: 9, title: 'Retired', price: 10, stock_qty: 5, active: false, variants: [] },
};

describe('resolveLines — server-authoritative pricing', () => {
  test('prices come from the DB row, not the client', () => {
    const { errors, lines } = resolveLines(
      [{ product_id: 1, qty: 2, unit_price: 1, line_total: 2 }], catalog // client lies about price
    );
    expect(errors).toEqual([]);
    expect(lines[0].unit_price).toBe(24);      // server price, client's "1" ignored
    expect(lines[0].line_total).toBe(48);
  });

  test('variant delta is applied and the title is composed', () => {
    const { errors, lines } = resolveLines([{ product_id: 2, variant_id: 21, qty: 1 }], catalog);
    expect(errors).toEqual([]);
    expect(lines[0].unit_price).toBe(20);
    expect(lines[0].title).toBe('Body Oil — 30ml');
  });

  test('rejects empty cart, bad qty, inactive product', () => {
    expect(resolveLines([], catalog).errors).toContain('empty_cart');
    expect(resolveLines([{ product_id: 1, qty: 0 }], catalog).errors).toContain('invalid_qty:1');
    expect(resolveLines([{ product_id: 9, qty: 1 }], catalog).errors).toContain('unavailable:9');
  });

  test('requires a variant when the product has active variants', () => {
    expect(resolveLines([{ product_id: 2, qty: 1 }], catalog).errors).toContain('variant_required:2');
  });

  test('rejects an out-of-stock or inactive variant', () => {
    expect(resolveLines([{ product_id: 2, variant_id: 22, qty: 1 }], catalog).errors)
      .toContain('insufficient_stock:2');
    expect(resolveLines([{ product_id: 2, variant_id: 23, qty: 1 }], catalog).errors)
      .toContain('variant_unavailable:23');
  });

  test('rejects buying more than stock', () => {
    expect(resolveLines([{ product_id: 1, qty: 99 }], catalog).errors).toContain('insufficient_stock:1');
  });
});

describe('computeTotals', () => {
  const lines = [{ line_total: 48 }, { line_total: 12 }]; // 60
  test('subtotal + tax + flat shipping', () => {
    expect(computeTotals(lines, { taxRate: 0.0875, flatRate: 8, freeThreshold: 100 }))
      .toEqual({ subtotal: 60, tax: 5.25, tax_rate: 0.0875, shipping: 8, total: 73.25 });
  });
  test('free shipping at/over threshold', () => {
    expect(computeTotals(lines, { flatRate: 8, freeThreshold: 50 }).shipping).toBe(0);
  });
});

describe('formatOrderNumber', () => {
  test('zero-pads with a CEL- prefix', () => {
    expect(formatOrderNumber(1)).toBe('CEL-00001');
    expect(formatOrderNumber(12345)).toBe('CEL-12345');
    expect(formatOrderNumber('7')).toBe('CEL-00007');
  });
});

describe('planFinalize — idempotent ledger decision', () => {
  test('records payment == total when pending', () => {
    const plan = planFinalize({ id: 1, total: '73.25', payment_status: 'pending' });
    expect(plan.skip).toBe(false);
    expect(plan.payment.amount).toBe(73.25);         // payment == total (ledger invariant)
    expect(plan.order).toEqual({ amount_paid: 73.25, payment_status: 'paid' });
  });
  test('skips an already-paid order (no double record)', () => {
    expect(planFinalize({ id: 1, total: 73.25, payment_status: 'paid' }))
      .toEqual({ skip: true, reason: 'already_paid' });
  });
  test('skips a missing order', () => {
    expect(planFinalize(undefined).skip).toBe(true);
  });
});
