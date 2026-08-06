import { Routes, Route } from 'react-router-dom';
import Storefront from './pages/Storefront';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import RequireAuth from './pages/admin/RequireAuth';

export default function App() {
  return (
    <Routes>
      {/* Storefront — public */}
      <Route path="/" element={<Storefront />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
    </Routes>
  );
}
