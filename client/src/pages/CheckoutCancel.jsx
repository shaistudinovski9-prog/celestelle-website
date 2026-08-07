import { Link } from 'react-router-dom';
import StoreLayout from '../components/StoreLayout';

export default function CheckoutCancel() {
  return (
    <StoreLayout footer={false}>
      <main className="container" style={{ maxWidth: 560, padding: '48px 20px 90px' }}>
        <div className="card">
          <h1>Checkout cancelled</h1>
          <p className="muted">No payment was taken. Your cart is still saved.</p>
          <p><Link className="btn-editorial" to="/cart">Return to cart</Link></p>
        </div>
      </main>
    </StoreLayout>
  );
}
