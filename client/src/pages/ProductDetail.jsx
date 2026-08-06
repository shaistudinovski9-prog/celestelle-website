// Public product detail with a variant picker (Milestone 2).
// "Add to cart" is stubbed until Milestone 3 wires the cart + checkout.
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { effectiveUnitPrice, inStock, formatMoney, hasCompareAt, savings } from '../lib/products';
import { useCart } from '../context/CartContext';
import StoreHeader from '../components/StoreHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [status, setStatus] = useState('loading');
  const [added, setAdded] = useState(false);
  useDocumentTitle(
    product ? `${product.title} — Celestelle` : 'Celestelle',
    product?.description || undefined
  );

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

  const addToCart = () => {
    add({
      product_id: product.id,
      variant_id: hasVariants ? variant.id : null,
      title: hasVariants ? `${product.title} — ${variant.label}` : product.title,
      price: Number(product.price),
      priceDelta: hasVariants ? Number(variant.price_delta || 0) : 0,
      slug: product.slug,
      image_url: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div>
      <StoreHeader storeName="Celestelle" />
      <main className="container">
        <div className="detail">
          <div className="detail-media">
            {product.image_url
              ? <img src={product.image_url} alt={product.title} />
              : <div className="thumb-placeholder" aria-hidden="true" />}
          </div>
          <div className="detail-info">
            <h1>{product.title}</h1>
            <div className="product-price" style={{ fontSize: 22 }}>
              {formatMoney(unitPrice)}
              {!hasVariants && hasCompareAt(product) && (
                <>
                  <span className="was">{formatMoney(product.compare_at_price)}</span>
                  <span className="save-badge">Save {formatMoney(savings(product))}</span>
                </>
              )}
            </div>
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

            <div className="cta-row">
              <button className="btn" disabled={!buyable} onClick={addToCart}
                title={buyable ? '' : 'Out of stock'}>
                {buyable ? (added ? 'Added ✓' : 'Add to cart') : 'Sold out'}
              </button>
              <button className="btn-secondary" onClick={() => navigate('/cart')}>View cart</button>
            </div>

            {product.how_to_use && (
              <div className="pdp-detail">
                <h3>How to use</h3>
                <p className="muted">{product.how_to_use}</p>
              </div>
            )}
            {product.ingredients && (
              <div className="pdp-detail">
                <h3>Ingredients</h3>
                <p className="muted">{product.ingredients}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
