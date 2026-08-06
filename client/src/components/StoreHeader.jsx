import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Shared storefront header with a live cart badge.
export default function StoreHeader({ storeName = 'Celestelle' }) {
  const { count } = useCart();
  return (
    <header className="topbar">
      <div className="brand"><Link to="/">{storeName}</Link></div>
      <nav className="store-nav">
        <Link to="/cart">Cart{count > 0 && <span className="cart-badge">{count}</span>}</Link>
        <Link to="/admin">Admin</Link>
      </nav>
    </header>
  );
}
