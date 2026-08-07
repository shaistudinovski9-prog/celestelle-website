import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { effectiveUnitPrice, inStock, formatMoney, hasCompareAt, savings, toCartEntry } from '../lib/products';
import { useCart } from '../context/CartContext';
import ProductVisual from '../components/ProductVisual';
import StoreLayout from '../components/StoreLayout';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [status, setStatus] = useState('loading');
  const [added, setAdded] = useState(false);
  useDocumentTitle(product ? `${product.title} — Celestelle` : 'Celestelle', product?.description || undefined);

  useEffect(() => {
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        if (data.variants?.length) setVariant(data.variants[0]);
        setStatus('ready');
      })
      .catch((err) => setStatus(err.response?.status === 404 ? 'notfound' : 'error'));
  }, [slug]);

  if (status === 'loading') return <StoreLayout><main className="pdp"><p className="muted">Loading…</p></main></StoreLayout>;
  if (status === 'notfound') return (
    <StoreLayout><main className="pdp"><h1 className="display">Not found</h1>
      <p><Link className="ulink" to="/shop">← Back to shop</Link></p></main></StoreLayout>
  );
  if (status === 'error') return <StoreLayout><main className="pdp"><p className="muted">Something went wrong.</p></main></StoreLayout>;

  const hasVariants = (product.variants || []).length > 0;
  const buyable = inStock(product, hasVariants ? variant : null);
  const unitPrice = effectiveUnitPrice(product, hasVariants ? variant : null);

  const addToCart = () => {
    add(toCartEntry(product, hasVariants ? variant : null));
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <StoreLayout>
      <main className="pdp">
        <div className="pdp-media"><ProductVisual product={product} panel /></div>
        <div className="pdp-info">
          <span className="kicker">Celestelle</span>
          <h1 className="display pdp-h">{product.title}</h1>
          <div className="pdp-price">
            {formatMoney(unitPrice)}
            {!hasVariants && hasCompareAt(product) && (
              <>
                <em>{formatMoney(product.compare_at_price)}</em>
                <span className="pdp-save">Save {formatMoney(savings(product))}</span>
              </>
            )}
          </div>
          {product.description && <p className="pdp-desc">{product.description}</p>}

          {hasVariants && (
            <div className="pdp-variants">
              {product.variants.map((v) => {
                const disabled = v.active === false || Number(v.stock_qty) <= 0;
                return (
                  <button key={v.id} type="button" className={`pdp-chip${variant?.id === v.id ? ' on' : ''}`}
                    disabled={disabled} onClick={() => setVariant(v)}>{v.label}</button>
                );
              })}
            </div>
          )}

          <div className="pdp-cta">
            <button className="btn-editorial" disabled={!buyable} onClick={addToCart}>
              {buyable ? (added ? 'Added ✓' : 'Add to Bag') : 'Sold out'}
            </button>
            <button className="ulink" onClick={() => navigate('/cart')}>View cart</button>
          </div>
          <p className="pdp-assure">Complimentary shipping · 30-day money-back guarantee</p>

          {product.how_to_use && <div className="pdp-block"><h3>How to use</h3><p>{product.how_to_use}</p></div>}
          {product.ingredients && <div className="pdp-block"><h3>Ingredients</h3><p>{product.ingredients}</p></div>}
        </div>
      </main>

      <style>{`
        .pdp { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 5vw, 84px); align-items: start;
          max-width: 1200px; margin: 0 auto; padding: clamp(40px, 7vh, 90px) clamp(24px, 5vw, 64px) clamp(72px, 10vh, 140px); }
        .pdp-media { position: sticky; top: 96px; }
        .pdp-info { padding-top: 8px; }
        .pdp-h { font-size: clamp(32px, 4vw, 56px); margin: 14px 0 18px; }
        .pdp-price { font-family: var(--serif); font-size: clamp(24px, 2.4vw, 32px); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .pdp-price em { font-style: normal; color: var(--espresso-soft); text-decoration: line-through; font-size: 0.72em; }
        .pdp-save { font-family: var(--sans); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: #1c7a3e; background: #e3f4e8; padding: 4px 10px; border-radius: 999px; }
        .pdp-desc { color: var(--espresso-soft); font-weight: 300; line-height: 1.85; margin: 22px 0; max-width: 46ch; }
        .pdp-variants { display: flex; gap: 10px; flex-wrap: wrap; margin: 8px 0 26px; }
        .pdp-chip { padding: 9px 18px; border: 1px solid var(--champagne); border-radius: 999px; background: transparent; font-size: 13px; color: var(--espresso); }
        .pdp-chip.on { border-color: var(--gold); color: var(--gold-deep); font-weight: 600; }
        .pdp-chip:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
        .pdp-cta { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; margin-top: 8px; }
        .pdp-assure { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--espresso-soft); margin-top: 18px; }
        .pdp-block { border-top: 1px solid var(--line); margin-top: 28px; padding-top: 22px; }
        .pdp-block h3 { font-size: 18px; font-weight: 500; margin-bottom: 8px; }
        .pdp-block p { color: var(--espresso-soft); font-weight: 300; line-height: 1.7; font-size: 15px; }
        @media (max-width: 820px) { .pdp { grid-template-columns: 1fr; } .pdp-media { position: static; max-width: 420px; margin: 0 auto; } }
      `}</style>
    </StoreLayout>
  );
}
