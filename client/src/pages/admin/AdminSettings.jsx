// Store settings + per-state tax rules editor.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { US_STATES } from '../../lib/usStates';

const STORE_FIELDS = [
  ['store_name', 'Store name'],
  ['tax_label', 'Tax label (e.g. "CA Tax")'],
  ['tax_rate', 'Default tax rate (decimal, e.g. 0.0875)'],
  ['ship_flat_rate', 'Flat shipping rate (USD)'],
  ['free_ship_threshold', 'Free shipping over (USD, 0 = off)'],
  ['currency', 'Currency (e.g. USD)'],
];

export default function AdminSettings() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState({});
  const [rules, setRules] = useState([]);
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [testTo, setTestTo] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => { if (admin?.email) setTestTo(admin.email); }, [admin]);

  const sendTest = async () => {
    setTestMsg('');
    setTestBusy(true);
    try {
      const { data } = await api.post('/settings/test-email', { to: testTo });
      if (!data.configured) {
        setTestMsg('⚠️ No email provider is set. Add RESEND_API_KEY in Render.');
      } else if (data.result?.sent) {
        setTestMsg(`✅ Sent to ${testTo}. Check that inbox (and spam).`);
      } else if (data.result?.skipped) {
        setTestMsg(`⚠️ Skipped (${data.result.reason}).`);
      } else {
        setTestMsg(`❌ Provider rejected it: ${data.result?.error || 'status ' + data.result?.status}. `
          + `(The test sender only delivers to your own Resend email until you verify a domain.)`);
      }
    } catch {
      setTestMsg('❌ Request failed. Is the site deployed with the latest code?');
    } finally {
      setTestBusy(false);
    }
  };

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/settings/tax-rules')])
      .then(([s, r]) => { setSettings(s.data); setRules(r.data); })
      .finally(() => setLoading(false));
  }, []);

  const flash = (m) => { setSavedMsg(m); setTimeout(() => setSavedMsg(''), 2000); };

  const saveSettings = async () => {
    const { data } = await api.put('/settings', settings);
    setSettings(data);
    flash('Settings saved.');
  };

  const saveRules = async () => {
    const clean = rules.filter((r) => r.state).map((r) => ({ state: r.state, rate: Number(r.rate) || 0 }));
    const { data } = await api.put('/settings/tax-rules', { rules: clean });
    setRules(data);
    flash('Tax rules saved.');
  };

  const addRule = () => setRules((r) => [...r, { state: '', rate: '' }]);
  const setRule = (i, k, v) => setRules((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const removeRule = (i) => setRules((r) => r.filter((_, idx) => idx !== i));

  if (loading) return <main className="container"><p className="muted">Loading…</p></main>;

  return (
    <div>
      <header className="topbar">
        <div className="brand">Celestelle Admin</div>
        <Link to="/admin">← Dashboard</Link>
      </header>
      <main className="container" style={{ maxWidth: 640 }}>
        <h1>Settings</h1>
        {savedMsg && <div className="badge badge-green" style={{ marginBottom: 12 }}>{savedMsg}</div>}

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Email test</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Send yourself a test email to confirm your provider is working — no order needed.
          </p>
          <div className="field">
            <label>Send test to</label>
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@email.com" />
          </div>
          <button className="btn" onClick={sendTest} disabled={testBusy || !testTo}>
            {testBusy ? 'Sending…' : 'Send test email'}
          </button>
          {testMsg && <p style={{ marginTop: 10, fontSize: 14 }}>{testMsg}</p>}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Store</h2>
          {STORE_FIELDS.map(([key, lbl]) => (
            <div className="field" key={key}>
              <label>{lbl}</label>
              <input value={settings[key] ?? ''} onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))} />
            </div>
          ))}
          <button className="btn" onClick={saveSettings}>Save store settings</button>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="row-between">
            <h2 style={{ margin: 0 }}>Per-state tax</h2>
            <button className="btn" onClick={addRule}>+ Add state</button>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            Overrides the default rate for a destination state. Rate is a decimal (0.0725 = 7.25%).
          </p>
          {rules.map((r, i) => (
            <div key={i} className="two-col" style={{ alignItems: 'end', marginBottom: 8 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>State</label>
                <select className="select" value={r.state} onChange={(e) => setRule(i, 'state', e.target.value)}>
                  <option value="">—</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field" style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <label>Rate</label>
                  <input value={r.rate} onChange={(e) => setRule(i, 'rate', e.target.value)} inputMode="decimal" />
                </div>
                <button className="link-danger" onClick={() => removeRule(i)}>Remove</button>
              </div>
            </div>
          ))}
          <button className="btn" onClick={saveRules}>Save tax rules</button>
        </div>
      </main>
    </div>
  );
}
