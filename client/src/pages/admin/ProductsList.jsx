import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../lib/products';

export default function ProductsList() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/products/admin/all')
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id) => {
    if (!window.confirm('Deactivate this product? It will be hidden from the store.')) return;
    await api.delete(`/products/${id}`);
    load();
  };

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
        <div className="row-between">
          <h1>Products</h1>
          <button className="btn" onClick={() => navigate('/admin/products/new')}>+ New product</button>
        </div>
        {loading ? <p className="muted">Loading…</p> : (
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/admin/products/${p.id}`}>{p.title}</Link></td>
                  <td>{formatMoney(p.price)}</td>
                  <td>{p.stock_qty}</td>
                  <td>{p.active ? 'Active' : 'Hidden'}</td>
                  <td className="right">
                    <Link to={`/admin/products/${p.id}`}>Edit</Link>
                    {p.active && <> · <a href="#" onClick={(e) => { e.preventDefault(); remove(p.id); }}>Hide</a></>}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="5" className="muted">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
