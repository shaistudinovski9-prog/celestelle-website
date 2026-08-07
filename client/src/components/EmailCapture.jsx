import { useState } from 'react';

// Email capture — turns non-buyers into a re-marketable list. Stores locally for
// now; wire `submit` to a /api/subscribe endpoint or your email provider later.
export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    try {
      const list = JSON.parse(localStorage.getItem('celestelle_emails') || '[]');
      list.push({ email, at: new Date().toISOString() });
      localStorage.setItem('celestelle_emails', JSON.stringify(list));
    } catch { /* ignore */ }
    setDone(true);
  }

  return (
    <section className="emailcap">
      <div className="wrap emailcap-inner">
        <span className="kicker">The Celestelle house</span>
        <h2 className="display emailcap-h">Enter our world</h2>
        <p className="emailcap-sub">
          An invitation to private previews, new routines, and the quiet pleasures
          of the house — extended only to those who join us.
        </p>
        {done ? (
          <p className="emailcap-thanks">Welcome. We will be in touch.</p>
        ) : (
          <form className="emailcap-form" onSubmit={submit}>
            <input type="email" required placeholder="Your email address"
              value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
            <button className="btn-editorial emailcap-btn" type="submit">Request Invitation</button>
          </form>
        )}
      </div>
      <style>{`
        .emailcap { background: var(--ivory-2); color: var(--espresso); border-top: 1px solid var(--line); }
        .emailcap-inner { padding: clamp(80px, 13vh, 150px) 24px; text-align: center; max-width: 760px; }
        .emailcap-h { font-size: clamp(38px, 5vw, 64px); margin: 18px 0 18px; }
        .emailcap-sub { color: var(--espresso-soft); font-size: clamp(16px, 1.3vw, 18px); font-weight: 300; line-height: 1.8; max-width: 50ch; margin: 0 auto; }
        .emailcap-form { display: flex; gap: 12px; justify-content: center; margin-top: 36px; flex-wrap: wrap; }
        .emailcap-form input { padding: 17px 22px; border-radius: 2px; border: 1px solid var(--champagne); background: var(--cream-card); color: var(--espresso); font-size: 15px; min-width: 300px; }
        .emailcap-form input::placeholder { color: var(--espresso-soft); }
        .emailcap-btn { padding: 17px 36px; }
        .emailcap-thanks { margin-top: 28px; color: var(--gold-deep); font-size: 19px; font-family: var(--serif); }
      `}</style>
    </section>
  );
}
