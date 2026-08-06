import { Link } from 'react-router-dom';
import StoreHeader from '../components/StoreHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Not found — Celestelle');
  return (
    <div>
      <StoreHeader storeName="Celestelle" />
      <main className="container" style={{ maxWidth: 560 }}>
        <div className="card">
          <h1>Page not found</h1>
          <p className="muted">The page you’re looking for doesn’t exist.</p>
          <p><Link className="btn" to="/">← Back to shop</Link></p>
        </div>
      </main>
    </div>
  );
}
