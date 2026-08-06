import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../lib/products';
import { label, badgeClass } from '../../lib/orderStatus';

export default function AdminOrders() {
  const { admin, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="topbar">
        <div className="brand">Celestelle Admin</div>
        <div>
          <Link to="/admin/products" style={{ marginRight: 16 }}>Products</Link>
          <span className="muted" style={{ marginRight: 12 }}>{admin?.email}</span>
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="container">
        <h1>Orders</h1>
        {loading ? <p className="muted">Loading…</p> : (
          <table className="table">
            <thead>
              <tr><th>Order</th><th>Email</th><th>Total</th><th>Payment</th><th>Fulfillment</th><th>Date</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`}>{o.order_number}</Link></td>
                  <td className="muted">{o.customer_email}</td>
                  <td>{formatMoney(o.total)}</td>
                  <td><span className={badgeClass(o.payment_status)}>{label(o.payment_status)}</span></td>
                  <td><span className={badgeClass(o.fulfillment_status)}>{label(o.fulfillment_status)}</span></td>
                  <td className="muted">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="6" className="muted">No orders yet.</td></tr>}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
