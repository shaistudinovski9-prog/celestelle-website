import StoreNav from './StoreNav';
import StoreFooter from './StoreFooter';

// Wraps every storefront page in the branded shell (scopes the design via `.store`).
export default function StoreLayout({ children, footer = true }) {
  return (
    <div className="store">
      <StoreNav />
      {children}
      {footer && <StoreFooter />}
    </div>
  );
}
