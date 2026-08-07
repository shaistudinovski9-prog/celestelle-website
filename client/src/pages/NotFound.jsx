import { Link } from 'react-router-dom';
import StoreLayout from '../components/StoreLayout';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Not found — Celestelle');
  return (
    <StoreLayout>
      <main className="container" style={{ maxWidth: 560, padding: '80px 20px 120px', textAlign: 'center' }}>
        <h1 className="display" style={{ fontSize: 'clamp(32px,5vw,56px)' }}>Page not found</h1>
        <p className="muted" style={{ marginTop: 12 }}>The page you’re looking for doesn’t exist.</p>
        <p style={{ marginTop: 20 }}><Link className="btn-editorial" to="/">← Back to shop</Link></p>
      </main>
    </StoreLayout>
  );
}
