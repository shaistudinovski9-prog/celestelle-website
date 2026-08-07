import { useEffect, useState } from 'react';
import api from '../api';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import StoreLayout from '../components/StoreLayout';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Collection buckets, matched against a product's title keywords (our API has no
// collection column yet — this keeps the filters working from the imported names).
const COLLECTIONS = [
  ['All', () => true],
  ['Sets', (t) => /set/i.test(t)],
  ['Vitamin C', (t) => /vitamin c/i.test(t)],
  ['24K Gold', (t) => /24k|gold/i.test(t)],
  ['Black Truffle', (t) => /truffle/i.test(t)],
  ['Treatments', (t) => /corrector|mask|peeling/i.test(t)],
];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState('All');
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Shop — Celestelle', 'Shop Celestelle luxury skincare — Vitamin C, 24K Gold, and Black Truffle.');

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data)).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  const match = COLLECTIONS.find(([name]) => name === active)?.[1] || (() => true);
  const list = active === 'All' ? products : products.filter((p) => match(p.title));

  return (
    <StoreLayout>
      <div className="shop">
        <Reveal as="header" className="shop-head">
          <span className="kicker">The Collection</span>
          <h1 className="display shop-h">Shop Celestelle</h1>
          <p className="shop-intro">Luxury Vitamin&nbsp;C, 24K Gold, and Black Truffle skincare — formulated for visibly radiant skin.</p>
        </Reveal>

        <div className="shop-filters">
          {COLLECTIONS.map(([name]) => (
            <button key={name} className={`shop-filter ${active === name ? 'on' : ''}`} onClick={() => setActive(name)}>{name}</button>
          ))}
        </div>

        {loading ? (
          <p className="muted" style={{ textAlign: 'center' }}>Loading…</p>
        ) : (
          <div className="shop-grid">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <style>{`
        .shop { padding: clamp(48px, 9vh, 120px) clamp(24px, 5vw, 64px) clamp(80px, 12vh, 150px); max-width: 1500px; margin: 0 auto; }
        .shop-head { text-align: center; margin-bottom: clamp(40px, 6vh, 64px); }
        .shop-h { font-size: clamp(42px, 5vw, 80px); margin: 16px 0 18px; }
        .shop-intro { color: var(--espresso-soft); font-weight: 300; font-size: clamp(15px, 1.2vw, 18px); line-height: 1.7; max-width: 50ch; margin: 0 auto; }
        .shop-filters { display: flex; gap: clamp(16px, 3vw, 42px); flex-wrap: wrap; justify-content: center; margin-bottom: clamp(50px, 7vh, 90px); border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); padding: 22px 0; }
        .shop-filter { background: none; border: none; font-size: 11.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--espresso-soft); padding-bottom: 5px; border-bottom: 1px solid transparent; transition: color .25s ease, border-color .25s ease; }
        .shop-filter:hover { color: var(--espresso); }
        .shop-filter.on { color: var(--gold-deep); border-bottom-color: var(--gold); }
        .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(40px, 5vh, 80px) clamp(24px, 3vw, 44px); }
        @media (max-width: 900px) { .shop-grid { grid-template-columns: repeat(2, 1fr); gap: 48px 24px; } }
        @media (max-width: 560px) { .shop-grid { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; } }
      `}</style>
    </StoreLayout>
  );
}
