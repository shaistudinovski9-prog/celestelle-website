import { Link } from 'react-router-dom';

export default function StoreFooter() {
  return (
    <footer className="sfooter">
      <div className="wrap sfooter-inner">
        <div>
          <div className="logo">Celestelle</div>
          <p className="muted sfooter-blurb">Routine-first luxury skincare. Cleanse. Treat. Nourish. Glow.</p>
        </div>
        <div className="sfooter-col">
          <h4>Shop</h4>
          <Link to="/shop">All products</Link>
          <Link to="/shop?c=Sets">Sets</Link>
          <Link to="/shop?c=Vitamin C">Vitamin C</Link>
          <Link to="/shop?c=24K Gold">24K Gold</Link>
        </div>
        <div className="sfooter-col">
          <h4>Help</h4>
          <a href="mailto:hello@celestellebeauty.com">Contact us</a>
          <span className="muted">Free shipping · 30-day guarantee</span>
        </div>
      </div>
      <div className="wrap sfooter-legal muted">© {new Date().getFullYear()} Celestelle Beauty. Secure checkout by Stripe.</div>

      <style>{`
        .sfooter { background: var(--ivory-2); border-top: 1px solid var(--line); margin-top: 40px; }
        .sfooter-inner { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 32px; padding: 56px 20px 32px; }
        .sfooter .logo { font-family: var(--serif); font-size: 28px; }
        .sfooter-blurb { max-width: 320px; margin-top: 8px; font-size: 14px; }
        .sfooter-col { display: flex; flex-direction: column; gap: 10px; font-size: 14px; }
        .sfooter-col h4 { font-family: var(--sans); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--espresso-soft); }
        .sfooter-col a:hover { color: var(--gold-deep); }
        .sfooter-legal { padding: 0 20px 40px; font-size: 13px; }
        @media (max-width: 640px) { .sfooter-inner { grid-template-columns: 1fr; gap: 28px; } }
      `}</style>
    </footer>
  );
}
