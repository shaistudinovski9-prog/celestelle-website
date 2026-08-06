import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  return (
    <div>
      <header className="topbar">
        <div className="brand">Celestelle Admin</div>
        <div>
          <span className="muted" style={{ marginRight: 12 }}>{admin?.email}</span>
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="container">
        <div className="card">
          <h1>Dashboard</h1>
          <p className="muted">Manage your catalog and orders.</p>
          <p style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/admin/products">Manage products</Link>
            <Link className="btn-secondary" to="/admin/orders">View orders</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
