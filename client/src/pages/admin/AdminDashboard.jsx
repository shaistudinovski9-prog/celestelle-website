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
          <p className="muted">Manage your catalog. Orders management arrives in Milestone&nbsp;4.</p>
          <p><Link className="btn" to="/admin/products">Manage products</Link></p>
        </div>
      </main>
    </div>
  );
}
