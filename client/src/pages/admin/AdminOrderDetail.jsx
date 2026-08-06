import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { formatMoney } from '../../lib/products';
import { label, badgeClass, nextFulfillment, FULFILLMENT_STEPS } from '../../lib/orderStatus';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [target, setTarget] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get(`/admin/orders/${id}`)
      .then(({ data }) => {
        setOrder(data);
        setTarget(nextFulfillment(data.fulfillment_status) || data.fulfillment_status);
        setTracking(data.tracking_number || '');
        setTrackingUrl(data.tracking_url || '');
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };
  useEffect(load, [id]);

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      await api.put(`/admin/orders/${id}/fulfill`, {
        status: target, tracking_number: tracking, tracking_url: trackingUrl,
      });
      load();
    } catch (err) {
      const d = err.response?.data?.details;
      setError(d ? `Cannot update: ${d.join(', ')}` : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') return <main className="container"><p className="muted">Loading…</p></main>;
  if (status === 'error') return <main className="container"><p className="error">Order not found.</p></main>;

  const a = order.shipping_address;

  return (
    <div>
      <header className="topbar">
        <div className="brand">Celestelle Admin</div>
        <Link to="/admin/orders">← Orders</Link>
      </header>
      <main className="container" style={{ maxWidth: 760 }}>
        <div className="row-between">
          <h1>{order.order_number}</h1>
          <div>
            <span className={badgeClass(order.payment_status)}>{label(order.payment_status)}</span>{' '}
            <span className={badgeClass(order.fulfillment_status)}>{label(order.fulfillment_status)}</span>
          </div>
        </div>

        <div className="card">
          <table className="table">
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.qty} × {it.title}</td>
                  <td className="right">{formatMoney(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals-row"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
          {Number(order.tax) > 0 && <div className="totals-row"><span>Tax</span><span>{formatMoney(order.tax)}</span></div>}
          <div className="totals-row"><span>Shipping</span><span>{Number(order.shipping) === 0 ? 'Free' : formatMoney(order.shipping)}</span></div>
          <div className="totals-row total"><span>Total</span><span>{formatMoney(order.total)}</span></div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Customer</h2>
          <p className="muted">{order.customer_email}</p>
          {a && (
            <p className="muted">
              {a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
              {a.city}, {a.state} {a.postal_code} {a.country}
            </p>
          )}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Fulfillment</h2>
          <div className="field">
            <label>Status</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="select">
              {FULFILLMENT_STEPS.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
          <div className="two-col">
            <div className="field">
              <label>Tracking number</label>
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1Z999…" />
            </div>
            <div className="field">
              <label>Tracking URL</label>
              <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Update fulfillment'}</button>
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            Moving to <strong>Shipped</strong> emails the customer their tracking info.
          </p>
        </div>
      </main>
    </div>
  );
}
