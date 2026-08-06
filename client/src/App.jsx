import { Routes, Route } from 'react-router-dom';
import Storefront from './pages/Storefront';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsList from './pages/admin/ProductsList';
import ProductEditor from './pages/admin/ProductEditor';
import RequireAuth from './pages/admin/RequireAuth';

export default function App() {
  return (
    <Routes>
      {/* Storefront — public */}
      <Route path="/" element={<Storefront />} />
      <Route path="/product/:slug" element={<ProductDetail />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/products" element={<RequireAuth><ProductsList /></RequireAuth>} />
      <Route path="/admin/products/new" element={<RequireAuth><ProductEditor /></RequireAuth>} />
      <Route path="/admin/products/:id" element={<RequireAuth><ProductEditor /></RequireAuth>} />
    </Routes>
  );
}
