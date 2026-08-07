// Cart review + shipping details + start checkout. Totals are quoted by the
// server (POST /checkout/quote) so tax reflects the destination state; the client
// math is only a first-paint fallback. The server re-prices authoritatively.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { lineKey, subtotal as clientSubtotal, toCheckoutItems } from '../lib/cart';
import { formatMoney } from '../lib/products';
import { US_STATES, validateShipping } from '../lib/usStates';
import useDocumentTitle from '../hooks/useDocumentTitle';
import StoreLayout from '../components/StoreLayout';

const BLANK_ADDR = { name: '', line1: '', line2: '', city: '', state: '', postal_code: '' };

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const [store, setStore] = useState({ store_name: 'Celestelle', tax_label: 'Tax' });
  const [email, setEmail] = useState('');
  const [addr, setAddr] = useState(BLANK_ADDR);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Your cart — Celestelle');

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => setStore(data)).catch(() => {});
  }, []);

  // Re-quote whenever the cart or destination state changes.
  useEffect(() => {
    if (items.length === 0) { setQuote(null); return; }
    let cancelled = false;
    api.post('/checkout/quote', { items: toCheckoutItems(items), state: addr.state })
      .then(({ data }) => { if (!cancelled) setQuote(data); })
      .catch(() => { if (!cancelled) setQuote(null); });
    return () => { cancelled = true; };
  }, [items, addr.state]);

  const setField = (k, v) => setAddr((a) => ({ ...a, [k]: v }));
  const sub = quote?.subtotal ?? clientSubtotal(items);
  const tax = quote?.tax ?? 0;
  const ship = quote?.shipping ?? 0;
  const total = quote?.total ?? sub;

  const checkout = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (validateShipping(addr).length) { setError('Please complete your shipping address.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/checkout', {
        email, items: toCheckoutItems(items), address: addr,
      });
      window.location.assign(data.url); // hand off to Stripe Checkout
    } catch (err) {
      const code = err.response?.data?.error;
      setError(
        code === 'payments_unconfigured' ? 'Checkout isn’t available yet — payments aren’t configured.'
        : code === 'address_invalid' ? 'Please check your shipping address.'
        : code === 'cart_invalid' ? 'Some items are no longer available. Please review your cart.'
        : 'Could not start checkout. Please try again.'
      );
      setBusy(false);
    }
  };

  return (
    <StoreLayout footer={false}>
      <main className="container" style={{ maxWidth: 720, padding: '40px 20px 80px' }}>
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
              <h2 style={{ marginTop: 0 }}>Shipping to</h2>
              <div className="field">
                <label>Full name</label>
                <input value={addr.name} onChange={(e) => setField('name', e.target.value)} />
              </div>
              <div className="field">
                <label>Address</label>
                <input value={addr.line1} onChange={(e) => setField('line1', e.target.value)} placeholder="Street address" />
              </div>
              <div className="field">
                <input value={addr.line2} onChange={(e) => setField('line2', e.target.value)} placeholder="Apt, suite (optional)" />
              </div>
              <div className="addr-grid">
                <div className="field">
                  <label>City</label>
                  <input value={addr.city} onChange={(e) => setField('city', e.target.value)} />
                </div>
                <div className="field">
                  <label>State</label>
                  <select className="select" value={addr.state} onChange={(e) => setField('state', e.target.value)}>
                    <option value="">—</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>ZIP</label>
                  <input value={addr.postal_code} onChange={(e) => setField('postal_code', e.target.value)} inputMode="numeric" />
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="totals-row"><span>Subtotal</span><span>{formatMoney(sub)}</span></div>
              <div className="totals-row">
                <span>{store.tax_label || 'Tax'}{!addr.state && <span className="muted"> (enter state)</span>}</span>
                <span>{formatMoney(tax)}</span>
              </div>
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
                You’ll enter payment securely on the next screen.
              </p>
            </div>
          </>
        )}
      </main>
    </StoreLayout>
  );
}
