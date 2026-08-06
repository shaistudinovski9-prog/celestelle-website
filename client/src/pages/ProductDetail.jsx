// Public product detail with a variant picker (Milestone 2).
// "Add to cart" is stubbed until Milestone 3 wires the cart + checkout.
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { effectiveUnitPrice, inStock, formatMoney } from '../lib/products';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        if (data.variants?.length) setVariant(data.variants[0]);
        setStatus('ready');
      })
      .catch((err) => setStatus(err.response?.status === 404 ? 'notfound' : 'error'));
  }, [slug]);

  if (status === 'loading') return <main className="container"><p className="muted">Loading…</p></main>;
  if (status === 'notfound') return (
    <main className="container"><div className="card"><h1>Not found</h1>
      <p><Link to="/">← Back to shop</Link></p></div></main>
  );
  if (status === 'error') return <main className="container"><p className="error">Something went wrong.</p></main>;

  const hasVariants = (product.variants || []).length > 0;
  const buyable = inStock(product, hasVariants ? variant : null);
  const unitPrice = effectiveUnitPrice(product, hasVariants ? variant : null);

  return (
    <div>
      <header className="topbar">
        <div className="brand"><Link to="/">Celestelle</Link></div>
      </header>
      <main className="container">
        <div className="detail">
          <div className="detail-media">
            {product.image_url
              ? <img src={product.image_url} alt={product.title} />
              : <div className="thumb-placeholder" aria-hidden="true" />}
          </div>
          <div className="detail-info">
            <h1>{product.title}</h1>
            <div className="product-price" style={{ fontSize: 22 }}>{formatMoney(unitPrice)}</div>
            {product.description && <p className="muted">{product.description}</p>}

            {hasVariants && (
              <div className="field">
                <label>Option</label>
                <div className="variant-row">
                  {product.variants.map((v) => {
                    const disabled = v.active === false || Number(v.stock_qty) <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`variant-chip${variant?.id === v.id ? ' selected' : ''}`}
                        disabled={disabled}
                        onClick={() => setVariant(v)}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="btn" disabled={!buyable} title={buyable ? '' : 'Out of stock'}>
              {buyable ? 'Add to cart' : 'Sold out'}
            </button>
            <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              Cart &amp; checkout arrive in Milestone&nbsp;3.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
