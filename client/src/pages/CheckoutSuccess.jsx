// Post-payment landing. Polls the session status; once the server confirms the
// order is paid, clears the cart and shows the order number.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import StoreHeader from '../components/StoreHeader';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { clear } = useCart();
  const [state, setState] = useState('checking'); // checking | paid | pending | error
  const [order, setOrder] = useState(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) { setState('error'); return; }
    let tries = 0;
    let timer;
    const poll = async () => {
      tries += 1;
      try {
        const { data } = await api.get(`/checkout/session/${sessionId}/status`);
        if (data.order?.payment_status === 'paid' || data.payment_status === 'paid') {
          setOrder(data.order);
          setState('paid');
          if (!cleared.current) { clear(); cleared.current = true; }
          return;
        }
        if (tries < 8) timer = setTimeout(poll, 1500);
        else setState('pending');
      } catch {
        setState('error');
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [sessionId, clear]);

  return (
    <div>
      <StoreHeader storeName="Celestelle" />
      <main className="container" style={{ maxWidth: 560 }}>
        <div className="card">
          {state === 'checking' && <><h1>Confirming your order…</h1><p className="muted">One moment.</p></>}
          {state === 'paid' && (
            <>
              <h1>Thank you! 🎉</h1>
              <p>Your order <strong>{order?.order_number}</strong> is confirmed.</p>
              <p className="muted">A receipt is on its way to your email.</p>
              <p><Link to="/">← Continue shopping</Link></p>
            </>
          )}
          {state === 'pending' && (
            <>
              <h1>Payment received</h1>
              <p className="muted">We’re still finalizing your order. It’ll appear shortly — check your email for the receipt.</p>
              <p><Link to="/">← Back to shop</Link></p>
            </>
          )}
          {state === 'error' && (
            <>
              <h1>Hmm.</h1>
              <p className="muted">We couldn’t confirm this order automatically. If you were charged, your receipt email is the source of truth.</p>
              <p><Link to="/">← Back to shop</Link></p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
