// Create / edit a product, including its variants (replace-all on save).
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const BLANK = { title: '', slug: '', description: '', price: '', stock_qty: '0', image_url: '', active: true };
const BLANK_VARIANT = { label: '', sku: '', price_delta: '0', stock_qty: '0', active: true };

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState(BLANK);
  const [variants, setVariants] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    api.get(`/products/admin/${id}`)
      .then(({ data }) => {
        setForm({
          title: data.title || '', slug: data.slug || '', description: data.description || '',
          price: String(data.price ?? ''), stock_qty: String(data.stock_qty ?? '0'),
          image_url: data.image_url || '', active: data.active,
        });
        setVariants((data.variants || []).map((v) => ({
          id: v.id, label: v.label, sku: v.sku || '',
          price_delta: String(v.price_delta ?? '0'), stock_qty: String(v.stock_qty ?? '0'),
          active: v.active,
        })));
      })
      .catch(() => setError('Could not load product.'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setVariant = (i, k, v) =>
    setVariants((list) => list.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const addVariant = () => setVariants((list) => [...list, { ...BLANK_VARIANT }]);
  const removeVariant = (i) => setVariants((list) => list.filter((_, idx) => idx !== i));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = { ...form, variants };
    try {
      if (isNew) {
        const { data } = await api.post('/products', payload);
        navigate(`/admin/products/${data.id}`);
      } else {
        await api.put(`/products/${id}`, payload);
        navigate('/admin/products');
      }
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details ? `Please fix: ${details.join(', ')}` : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="container"><p className="muted">Loading…</p></main>;

  return (
    <div>
      <header className="topbar">
        <div className="brand">Celestelle Admin</div>
        <Link to="/admin/products">← Products</Link>
      </header>
      <main className="container" style={{ maxWidth: 720 }}>
        <h1>{isNew ? 'New product' : 'Edit product'}</h1>
        <form onSubmit={save}>
          <div className="card">
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setField('title', e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Slug (optional — auto-generated from title)</label>
              <input value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="auto" />
            </div>
            <div className="field">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div className="two-col">
              <div className="field">
                <label>Price (USD)</label>
                <input value={form.price} onChange={(e) => setField('price', e.target.value)} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Stock (base)</label>
                <input value={form.stock_qty} onChange={(e) => setField('stock_qty', e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <div className="field">
              <label>Image URL</label>
              <input value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} placeholder="https://…" />
            </div>
            <label className="inline">
              <input type="checkbox" checked={!!form.active} onChange={(e) => setField('active', e.target.checked)} />
              &nbsp;Active (visible in store)
            </label>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="row-between">
              <h2 style={{ margin: 0 }}>Variants</h2>
              <button type="button" className="btn" onClick={addVariant}>+ Add variant</button>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              Optional. Each variant's price = base price + delta. Leave empty for a single-option product.
            </p>
            {variants.map((v, i) => (
              <div key={v.id ?? `new-${i}`} className="variant-edit">
                <input placeholder="Label (e.g. 30ml)" value={v.label}
                  onChange={(e) => setVariant(i, 'label', e.target.value)} />
                <input placeholder="SKU" value={v.sku}
                  onChange={(e) => setVariant(i, 'sku', e.target.value)} />
                <input placeholder="±price" value={v.price_delta} inputMode="decimal"
                  onChange={(e) => setVariant(i, 'price_delta', e.target.value)} />
                <input placeholder="stock" value={v.stock_qty} inputMode="numeric"
                  onChange={(e) => setVariant(i, 'stock_qty', e.target.value)} />
                <button type="button" className="link-danger" onClick={() => removeVariant(i)}>Remove</button>
              </div>
            ))}
          </div>

          {error && <div className="error">{error}</div>}
          <div style={{ marginTop: 16 }}>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
