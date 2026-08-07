import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Thin editorial header: transparent over the hero, solidifies on scroll.
export default function StoreNav() {
  const { count } = useCart();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="announce">Complimentary shipping &amp; samples · 30-day guarantee</div>
      <header className={`snav ${solid ? 'snav-solid' : ''}`}>
        <div className="snav-inner">
          <nav className="snav-links snav-left">
            <NavLink to="/shop">Shop</NavLink>
            <NavLink to="/shop">Collections</NavLink>
          </nav>
          <Link to="/" className="logo">Celestelle</Link>
          <nav className="snav-links snav-right">
            <NavLink to="/shop">The House</NavLink>
            <Link to="/cart" className="cart-btn" aria-label="Open cart">
              Cart{count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </nav>
        </div>
      </header>

      <style>{`
        .announce { background: var(--obsidian); color: var(--ivory); text-align: center; font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; padding: 9px 12px; }
        .snav { position: sticky; top: 0; z-index: 50; transition: background .5s ease, border-color .5s ease; border-bottom: 1px solid transparent; }
        .snav-solid { background: rgba(244,239,231,0.9); backdrop-filter: blur(10px); border-bottom-color: var(--line); }
        .snav-inner { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 74px; padding: 0 clamp(20px, 4vw, 48px); }
        .logo { font-family: var(--serif); font-size: 28px; font-weight: 500; letter-spacing: 0.04em; text-align: center; }
        .snav-links { display: flex; align-items: center; gap: clamp(18px, 3vw, 38px); }
        .snav-right { justify-content: flex-end; }
        .snav-links a, .cart-btn { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--espresso); background: none; border: none; transition: color .25s ease; }
        .snav-links a:hover, .cart-btn:hover { color: var(--gold-deep); }
        .cart-btn { display: inline-flex; align-items: center; gap: 7px; }
        .cart-count { background: var(--gold); color: #fff; border-radius: 999px; min-width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; padding: 0 5px; letter-spacing: 0; }
        @media (max-width: 720px) {
          .snav-inner { grid-template-columns: 1fr auto; height: 62px; }
          .snav-left { display: none; }
          .snav-right { gap: 16px; }
          .logo { font-size: 23px; text-align: left; }
        }
      `}</style>
    </>
  );
}
