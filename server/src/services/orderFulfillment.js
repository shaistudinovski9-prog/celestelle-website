// Finalize a paid order — the single, idempotent transition shared by the Stripe
// webhook AND the status poll, so a payment is recorded exactly once no matter
// which path confirms it first.
//
// Ledger invariant (harvested from RBOS): SUM(order_payments.amount) ==
// orders.amount_paid. planFinalize() keeps payment == total == amount_paid.
const db = require('../db');
const { planFinalize } = require('../lib/orders');

// dbLike is injectable for tests; defaults to the real pool.
async function finalizeOrderPaid(orderId, { processorRef = null, method = 'stripe' } = {}, dbLike = db) {
  const client = await dbLike.getClient();
  try {
    await client.query('BEGIN');

    // Row-lock the order so concurrent webhook+poll can't both finalize.
    const { rows } = await client.query(
      'SELECT id, total, payment_status FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    const order = rows[0];
    const plan = planFinalize(order, { method });
    if (plan.skip) {
      await client.query('COMMIT');
      return { finalized: false, reason: plan.reason };
    }

    await client.query(
      `INSERT INTO order_payments (order_id, amount, method, processor_ref)
       VALUES ($1, $2, $3, $4)`,
      [orderId, plan.payment.amount, plan.payment.method, processorRef]
    );
    await client.query(
      `UPDATE orders SET amount_paid = $1, payment_status = $2 WHERE id = $3`,
      [plan.order.amount_paid, plan.order.payment_status, orderId]
    );

    // Decrement stock now that money is confirmed (never before).
    const { rows: items } = await client.query(
      'SELECT product_id, variant_id, qty FROM order_items WHERE order_id = $1',
      [orderId]
    );
    for (const it of items) {
      if (it.variant_id) {
        await client.query(
          'UPDATE product_variants SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2',
          [it.qty, it.variant_id]
        );
      } else if (it.product_id) {
        await client.query(
          'UPDATE products SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2',
          [it.qty, it.product_id]
        );
      }
    }

    await client.query('COMMIT');
    return { finalized: true, amount: plan.payment.amount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { finalizeOrderPaid };
