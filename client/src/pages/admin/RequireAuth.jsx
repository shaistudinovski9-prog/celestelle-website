import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Guards admin routes. Storefront routes never use this.
export default function RequireAuth({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <main className="container"><p className="muted">Loading…</p></main>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}
