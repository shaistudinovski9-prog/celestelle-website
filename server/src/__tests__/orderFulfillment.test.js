const { finalizeOrderPaid } = require('../services/orderFulfillment');

// A tiny in-memory fake of the pg pool/client, enough to exercise the
// finalize transaction and prove idempotency + the ledger invariant.
function makeFakeDb(initial) {
  const state = {
    order: { ...initial.order },
    payments: [],
    items: initial.items,
    stockUpdates: [],
  };
  const client = {
    async query(sql, params = []) {
      if (/^BEGIN|^COMMIT|^ROLLBACK/.test(sql)) return { rows: [] };
      if (/FROM orders WHERE id = \$1 FOR UPDATE/.test(sql)) return { rows: [{ ...state.order }] };
      if (/INSERT INTO order_payments/.test(sql)) {
        state.payments.push({ order_id: params[0], amount: params[1], method: params[2], ref: params[3] });
        return { rows: [] };
      }
      if (/UPDATE orders SET amount_paid/.test(sql)) {
        state.order.amount_paid = params[0];
        state.order.payment_status = params[1];
        return { rows: [] };
      }
      if (/SELECT product_id, variant_id, qty FROM order_items/.test(sql)) return { rows: state.items };
      if (/UPDATE (products|product_variants) SET stock_qty/.test(sql)) {
        state.stockUpdates.push({ sql, params });
        return { rows: [] };
      }
      return { rows: [] };
    },
    release() {},
  };
  return { state, getClient: async () => client };
}

describe('finalizeOrderPaid', () => {
  const seed = () => ({
    order: { id: 1, total: 50, payment_status: 'pending' },
    items: [{ product_id: 7, variant_id: null, qty: 2 }, { product_id: 9, variant_id: 42, qty: 1 }],
  });

  test('records one payment equal to total and marks the order paid', async () => {
    const db = makeFakeDb(seed());
    const result = await finalizeOrderPaid(1, { processorRef: 'pi_123' }, db);

    expect(result).toEqual({ finalized: true, amount: 50 });
    expect(db.state.payments).toHaveLength(1);
    expect(db.state.payments[0].amount).toBe(50);         // ledger: payment == total
    expect(db.state.order.amount_paid).toBe(50);          // ledger: amount_paid == total
    expect(db.state.order.payment_status).toBe('paid');
    // stock decremented once per item (variant vs product path)
    expect(db.state.stockUpdates).toHaveLength(2);
  });

  test('is idempotent — a second finalize records nothing more', async () => {
    const db = makeFakeDb(seed());
    await finalizeOrderPaid(1, { processorRef: 'pi_123' }, db); // webhook
    const second = await finalizeOrderPaid(1, { processorRef: 'pi_123' }, db); // poll

    expect(second).toEqual({ finalized: false, reason: 'already_paid' });
    expect(db.state.payments).toHaveLength(1);            // still exactly one
    expect(db.state.stockUpdates).toHaveLength(2);        // stock not double-decremented
  });
});
