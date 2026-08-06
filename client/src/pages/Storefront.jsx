// Public storefront — product grid (Milestone 2). Cart/checkout land in M3.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { priceLabel, inStock, hasCompareAt, savings, formatMoney } from '../lib/products';
import StoreHeader from '../components/StoreHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Storefront() {
  const [store, setStore] = useState({ store_name: 'Celestelle' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle(
    `${store.store_name || 'Celestelle'} — shop`,
    `Shop ${store.store_name || 'Celestelle'} products online.`
  );

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => setStore(data)).catch(() => {});
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <StoreHeader storeName={store.store_name || 'Celestelle'} />
      <main className="container">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : products.length === 0 ? (
          <div className="card">
            <h1>Coming soon</h1>
            <p className="muted">No products are published yet. Add some in the admin.</p>
          </div>
        ) : (
          <div className="grid">
            {products.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="product-card">
                <div className="product-thumb">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} />
                    : <div className="thumb-placeholder" aria-hidden="true" />}
                </div>
                <div className="product-body">
                  <div className="product-title">{p.title}</div>
                  <div className="product-price">
                    {priceLabel(p)}
                    {hasCompareAt(p) && <span className="was">{formatMoney(p.compare_at_price)}</span>}
                  </div>
                  {hasCompareAt(p) && <div className="save-badge">Save {formatMoney(savings(p))}</div>}
                  {!inStock(p) && <div className="muted">Sold out</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer className="site-footer">
        <div className="container muted">
          © {new Date().getFullYear()} {store.store_name || 'Celestelle'}
        </div>
      </footer>
    </div>
  );
}
