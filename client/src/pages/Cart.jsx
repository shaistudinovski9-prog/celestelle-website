// Cart review + start checkout. Totals shown here are display-only; the server
// recomputes them authoritatively when it creates the Stripe session.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { lineKey, subtotal, taxOf, shippingOf, toCheckoutItems } from '../lib/cart';
import { formatMoney } from '../lib/products';
import StoreHeader from '../components/StoreHeader';

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const [store, setStore] = useState({ tax_rate: 0, ship_flat_rate: 0, free_ship_threshold: 0 });
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => setStore(data)).catch(() => {});
  }, []);

  const sub = subtotal(items);
  const tax = taxOf(items, store.tax_rate);
  const ship = shippingOf(sub, { flatRate: store.ship_flat_rate, freeThreshold: store.free_ship_threshold });
  const total = sub + tax + ship;

  const checkout = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/checkout', { email, items: toCheckoutItems(items) });
      window.location.assign(data.url); // hand off to Stripe Checkout
    } catch (err) {
      const code = err.response?.data?.error;
      setError(
        code === 'payments_unconfigured' ? 'Checkout isn’t available yet — payments aren’t configured.'
        : code === 'cart_invalid' ? 'Some items are no longer available. Please review your cart.'
        : 'Could not start checkout. Please try again.'
      );
      setBusy(false);
    }
  };

  return (
    <div>
      <StoreHeader storeName={store.store_name || 'Celestelle'} />
      <main className="container" style={{ maxWidth: 720 }}>
        <h1>Your cart</h1>
        {items.length === 0 ? (
          <div className="card"><p className="muted">Your cart is empty.</p>
            <p><Link to="/">← Continue shopping</Link></p></div>
        ) : (
          <>
            <div className="card">
              {items.map((it) => {
                const key = lineKey(it);
                const unit = Number(it.price || 0) + Number(it.priceDelta || 0);
                return (
                  <div key={key} className="cart-line">
                    <div className="cart-line-title">
                      <Link to={`/product/${it.slug}`}>{it.title}</Link>
                      <div className="muted">{formatMoney(unit)} each</div>
                    </div>
                    <input className="qty" type="number" min="1" value={it.qty}
                      onChange={(e) => setQty(key, e.target.value)} />
                    <div className="cart-line-total">{formatMoney(unit * it.qty)}</div>
                    <button className="link-danger" onClick={() => remove(key)}>Remove</button>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="totals-row"><span>Subtotal</span><span>{formatMoney(sub)}</span></div>
              {tax > 0 && <div className="totals-row"><span>{store.tax_label || 'Tax'}</span><span>{formatMoney(tax)}</span></div>}
              <div className="totals-row"><span>Shipping</span><span>{ship === 0 ? 'Free' : formatMoney(ship)}</span></div>
              <div className="totals-row total"><span>Total</span><span>{formatMoney(total)}</span></div>

              <div className="field" style={{ marginTop: 16 }}>
                <label>Email (for your receipt)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              {error && <div className="error">{error}</div>}
              <button className="btn" disabled={busy} onClick={checkout}>
                {busy ? 'Starting checkout…' : 'Checkout'}
              </button>
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                You’ll enter payment &amp; shipping securely on the next screen.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
