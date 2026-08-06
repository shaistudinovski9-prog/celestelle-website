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
          <p className="muted">
            You're signed in. Products and orders management arrive in Milestones&nbsp;2 and&nbsp;4.
          </p>
        </div>
      </main>
    </div>
  );
}
