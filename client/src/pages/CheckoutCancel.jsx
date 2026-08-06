import { Link } from 'react-router-dom';
import StoreHeader from '../components/StoreHeader';

export default function CheckoutCancel() {
  return (
    <div>
      <StoreHeader storeName="Celestelle" />
      <main className="container" style={{ maxWidth: 560 }}>
        <div className="card">
          <h1>Checkout cancelled</h1>
          <p className="muted">No payment was taken. Your cart is still saved.</p>
          <p><Link className="btn" to="/cart">Return to cart</Link></p>
        </div>
      </main>
    </div>
  );
}
