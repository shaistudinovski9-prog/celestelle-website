import { Link } from 'react-router-dom';
import ProductVisual from './ProductVisual';
import { formatMoney, hasCompareAt, inStock } from '../lib/products';

// Editorial product card for the shop grid.
export default function ProductCard({ product }) {
  const soldOut = !inStock(product);
  return (
    <Link to={`/product/${product.slug}`} className="pcard">
      <div className="pcard-art">
        <ProductVisual product={product} panel />
        {hasCompareAt(product) && <span className="pcard-tag">Save {formatMoney(product.compare_at_price - product.price)}</span>}
      </div>
      <div className="pcard-body">
        <h3 className="pcard-name">{product.title}</h3>
        <div className="pcard-price">
          {formatMoney(product.price)}
          {hasCompareAt(product) && <em>{formatMoney(product.compare_at_price)}</em>}
        </div>
        {soldOut && <div className="muted pcard-sold">Sold out</div>}
      </div>
      <style>{`
        .pcard { display: block; }
        .pcard-art { position: relative; }
        .pcard-tag { position: absolute; top: 12px; left: 12px; background: var(--gold); color: #1a1611; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; padding: 5px 11px; border-radius: 999px; }
        .pcard-body { text-align: center; padding: 20px 8px 0; }
        .pcard-name { font-size: clamp(18px, 1.5vw, 22px); font-weight: 400; }
        .pcard-price { margin-top: 8px; font-family: var(--serif); font-size: 18px; color: var(--espresso); }
        .pcard-price em { font-style: normal; color: var(--espresso-soft); text-decoration: line-through; font-size: 0.82em; margin-left: 8px; }
        .pcard-sold { margin-top: 6px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
        .pcard:hover .pcard-name { color: var(--gold-deep); }
      `}</style>
    </Link>
  );
}
