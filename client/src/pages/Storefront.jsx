// Public storefront placeholder (Milestone 1). Product grid arrives at Milestone 2.
import { useEffect, useState } from 'react';
import api from '../api';

export default function Storefront() {
  const [store, setStore] = useState({ store_name: 'Celestelle' });

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => setStore(data)).catch(() => {});
  }, []);

  return (
    <div>
      <header className="topbar">
        <div className="brand">{store.store_name || 'Celestelle'}</div>
        <nav><a href="/admin">Admin</a></nav>
      </header>
      <main className="container">
        <div className="card">
          <h1>Welcome to {store.store_name || 'Celestelle'}</h1>
          <p className="muted">
            The storefront foundation is live. Product catalog and cart land in Milestone&nbsp;2–3.
          </p>
        </div>
      </main>
    </div>
  );
}
