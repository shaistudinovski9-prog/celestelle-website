import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { formatMoney, toCartEntry, hasCompareAt } from '../lib/products';
import ProductVisual from '../components/ProductVisual';
import Reveal from '../components/Reveal';
import EmailCapture from '../components/EmailCapture';
import StoreLayout from '../components/StoreLayout';
import useDocumentTitle from '../hooks/useDocumentTitle';

const BENEFITS = ['Brightens', 'Smooths', 'Hydrates'];
const ACTIVES = [
  ['20%', 'Vitamin C', 'A potent, stable dose to brighten and even tone.'],
  ['HA', 'Hyaluronic Acid', 'Deep, cushioning hydration that plumps and smooths.'],
  ['E', 'Vitamin E + Ferulic', 'Antioxidant defense that amplifies Vitamin C and guards against stress.'],
];
const REVIEWS = [
  { stars: 5, t: 'My skin has never looked more like itself. Lit from within.', who: '[ Verified client ]' },
  { stars: 5, t: 'I stopped wearing foundation. I finally didn’t feel I needed it.', who: '[ Verified client ]' },
  { stars: 5, t: 'Three weeks in and the dark spots I’d had for years are fading.', who: '[ Verified client ]' },
];

function Stars({ n = 5 }) {
  return <span className="stars" aria-label={`${n} out of 5`}>{'★'.repeat(n)}</span>;
}

export default function Home() {
  const { add } = useCart();
  const [byslug, setBySlug] = useState({});
  useDocumentTitle('Celestelle — Radiance you can see', 'Luxury Vitamin C skincare, formulated to brighten, smooth, and restore.');

  useEffect(() => {
    api.get('/products').then(({ data }) => {
      const map = {};
      for (const p of data) map[p.slug] = p;
      setBySlug(map);
    }).catch(() => {});
  }, []);

  const serum = byslug['vitamin-c-serum'];
  const set = byslug['starter-ritual'];
  const goShop = () => document.getElementById('icon')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <StoreLayout>
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <Reveal as="div" className="hero-rating"><Stars /> <span>Dermatologist tested · Cruelty-free</span></Reveal>
            <Reveal as="h1" variant="blur" delay={120} className="display hero-h">Radiance<br />you can see.</Reveal>
            <Reveal as="p" delay={300} className="hero-sub">
              Luxury Vitamin C skincare, formulated to brighten, smooth, and restore — visible results, beautifully made.
            </Reveal>
            <Reveal as="div" delay={440} className="hero-cta">
              <button className="btn-gold-solid" onClick={goShop}>
                Shop the Serum{serum ? ` — ${formatMoney(serum.price)}` : ''}
              </button>
              <Link to="/shop" className="ulink">Explore the collection</Link>
            </Reveal>
          </div>
          <Reveal variant="clip" className="hero-art">
            {serum && <img src={serum.image_url} alt="Celestelle Vitamin C Brightening Serum" />}
          </Reveal>
        </div>
      </section>

      {/* The Icon — spotlight + buy */}
      <section id="icon" className="icon">
        <Reveal variant="clip" className="icon-art"><ProductVisual product={serum} panel /></Reveal>
        <div className="icon-copy">
          <Reveal as="span" className="kicker">The Icon</Reveal>
          <Reveal as="h2" delay={60} className="display icon-h">Vitamin&nbsp;C<br />Brightening Serum</Reveal>
          <Reveal as="div" delay={120} className="icon-rate"><Stars /> <span>Loved by our community</span></Reveal>
          <Reveal as="p" delay={180} className="ch-body icon-desc">
            Our hero. A weightless serum of 20% Vitamin C, hyaluronic acid, and vitamin E that dissolves dullness in a
            single drop — for skin that looks visibly brighter, smoother, and awake.
          </Reveal>
          <Reveal as="div" delay={240} className="icon-benefits">
            {BENEFITS.map((b) => <span key={b} className="pill">{b}</span>)}
          </Reveal>
          <Reveal as="div" delay={300} className="icon-buy">
            <span className="icon-price">{serum ? formatMoney(serum.price) : ''}</span>
            <button className="btn-editorial" disabled={!serum} onClick={() => serum && add(toCartEntry(serum))}>Add to Bag</button>
          </Reveal>
          <Reveal as="p" delay={360} className="icon-assure">Complimentary shipping · 30-day money-back guarantee</Reveal>
        </div>
      </section>

      {/* Why it works */}
      <section className="actives">
        <Reveal className="actives-head">
          <span className="kicker">Why it works</span>
          <h2 className="display actives-h">Three actives. One luminous result.</h2>
        </Reveal>
        <div className="actives-grid">
          {ACTIVES.map(([sym, name, desc], i) => (
            <Reveal as="div" delay={i * 100} className="active" key={name}>
              <div className="active-sym">{sym}</div>
              <h3 className="active-name">{name}</h3>
              <p className="active-desc">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="proof">
        <Reveal className="proof-head">
          <span className="kicker">The Proof</span>
          <h2 className="display proof-h">Skin that speaks for itself.</h2>
        </Reveal>
        <div className="proof-grid">
          {REVIEWS.map((r, i) => (
            <Reveal as="figure" delay={i * 110} className="proof-item" key={i}>
              <Stars n={r.stars} />
              <blockquote>“{r.t}”</blockquote>
              <figcaption>{r.who}</figcaption>
            </Reveal>
          ))}
        </div>
        <Reveal className="proof-claims">
          <span>Dermatologist Tested</span><i>·</i><span>Paraben-Free</span><i>·</i><span>Cruelty-Free</span><i>·</i><span>For All Skin Types</span>
        </Reveal>
      </section>

      {/* The Set — AOV upsell */}
      <section className="set">
        <Reveal variant="clip" className="set-art">
          <img src="/images/live/vitamin-c-collection-v2.png" alt="The Radiance Set — Vitamin C trio" loading="lazy" />
        </Reveal>
        <div className="set-copy">
          <Reveal as="span" className="kicker">Complete the regimen</Reveal>
          <Reveal as="h2" delay={70} className="display set-h">The Radiance Set</Reveal>
          <Reveal as="p" delay={140} className="ch-body">
            Cleanse, treat, and nourish with the full Vitamin C trio — our serum, cleanser, and day cream. The complete
            routine for visibly brighter skin, bundled together.
          </Reveal>
          <Reveal as="div" delay={210} className="set-buy">
            <span className="set-price">
              {set ? formatMoney(set.price) : ''}
              {set && hasCompareAt(set) && <em>{formatMoney(set.compare_at_price)}</em>}
            </span>
            <button className="btn-gold-solid" disabled={!set} onClick={() => set && add(toCartEntry(set))}>Add the Set</button>
          </Reveal>
        </div>
      </section>

      {/* Guarantee */}
      <section className="guarantee">
        <Reveal className="guarantee-inner">
          <span className="kicker">Our promise</span>
          <h2 className="display guarantee-h">Love it, or your money back.</h2>
          <p className="ch-body">
            Try Celestelle for 30 days. If your skin doesn’t look and feel more radiant, we’ll refund you in full — keep
            the bottle. Complimentary shipping on every order, always.
          </p>
        </Reveal>
      </section>

      <EmailCapture />

      <style>{`
        .stars { color: var(--gold); letter-spacing: 3px; font-size: 13px; }
        .ch-body { font-size: clamp(16px, 1.25vw, 18px); font-weight: 300; line-height: 1.85; color: var(--espresso-soft); }
        .hero { background: var(--ivory); }
        .hero-grid { display: grid; grid-template-columns: 1.02fr 0.98fr; min-height: 88vh; max-width: 1500px; margin: 0 auto; }
        .hero-copy { display: flex; flex-direction: column; justify-content: center; padding: clamp(48px, 9vh, 130px) clamp(24px, 5vw, 88px); }
        .hero-rating { display: flex; align-items: center; gap: 12px; font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--espresso-soft); margin-bottom: 26px; }
        .hero-h { font-size: clamp(52px, 7.5vw, 112px); line-height: 0.95; }
        .hero-sub { font-size: clamp(16px, 1.35vw, 20px); font-weight: 300; line-height: 1.7; color: var(--espresso-soft); max-width: 36ch; margin: 28px 0 40px; }
        .hero-cta { display: flex; align-items: center; gap: 30px; flex-wrap: wrap; }
        .hero-art { position: relative; overflow: hidden; min-height: 60vh; background: var(--ivory-2); }
        .hero-art img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }

        .icon { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: clamp(40px, 6vw, 110px); max-width: 1300px; margin: 0 auto; padding: clamp(80px, 12vh, 170px) clamp(24px, 5vw, 80px); }
        .icon-h { font-size: clamp(36px, 4.6vw, 70px); margin: 16px 0 16px; line-height: 1.02; }
        .icon-rate { display: flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--espresso-soft); margin-bottom: 22px; }
        .icon-desc { max-width: 44ch; }
        .icon-benefits { display: flex; gap: 10px; flex-wrap: wrap; margin: 28px 0 32px; }
        .pill { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--espresso); border: 1px solid var(--champagne); border-radius: 999px; padding: 9px 18px; }
        .icon-buy { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
        .icon-price { font-family: var(--serif); font-size: clamp(26px, 2.4vw, 34px); }
        .icon-assure { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--espresso-soft); margin-top: 16px; }

        .actives { background: var(--cream-card); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: clamp(96px, 15vh, 200px) clamp(24px, 5vw, 80px); }
        .actives-head { text-align: center; margin-bottom: clamp(54px, 8vh, 100px); }
        .actives-h { font-size: clamp(32px, 4.4vw, 60px); margin-top: 16px; }
        .actives-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(32px, 5vw, 80px); max-width: 1100px; margin: 0 auto; }
        .active { text-align: center; }
        .active-sym { font-family: var(--serif); font-size: clamp(40px, 4vw, 60px); color: var(--gold); line-height: 1; }
        .active-name { font-family: var(--serif); font-size: clamp(22px, 2vw, 28px); font-weight: 400; margin: 16px 0 12px; }
        .active-desc { font-size: 15px; font-weight: 300; line-height: 1.8; color: var(--espresso-soft); max-width: 32ch; margin: 0 auto; }

        .proof { padding: clamp(96px, 15vh, 200px) clamp(24px, 5vw, 80px); text-align: center; }
        .proof-head { margin-bottom: clamp(48px, 7vh, 90px); }
        .proof-h { font-size: clamp(32px, 4.4vw, 60px); margin-top: 16px; }
        .proof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(36px, 5vw, 80px); max-width: 1200px; margin: 0 auto clamp(56px, 8vh, 96px); }
        .proof-item blockquote { font-family: var(--serif); font-size: clamp(20px, 1.9vw, 26px); line-height: 1.4; margin: 18px 0; }
        .proof-item figcaption { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-deep); }
        .proof-claims { display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--espresso-soft); }
        .proof-claims i { color: var(--gold); }

        .set { display: grid; grid-template-columns: 1.1fr 0.9fr; align-items: center; gap: clamp(40px, 6vw, 100px); max-width: 1300px; margin: 0 auto; padding: clamp(80px, 12vh, 180px) clamp(24px, 5vw, 80px); }
        .set-art { border-radius: 6px; overflow: hidden; box-shadow: var(--shadow-lux); }
        .set-art img { width: 100%; display: block; }
        .set-h { font-size: clamp(38px, 5vw, 72px); margin: 16px 0 22px; }
        .set-buy { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; margin-top: 30px; }
        .set-price { font-family: var(--serif); font-size: clamp(26px, 2.4vw, 34px); }
        .set-price em { font-style: normal; color: var(--espresso-soft); text-decoration: line-through; font-size: 0.7em; margin-left: 12px; }

        .guarantee { background: var(--obsidian); color: var(--ivory); padding: clamp(96px, 15vh, 200px) 24px; text-align: center; }
        .guarantee-inner { max-width: 760px; margin: 0 auto; }
        .guarantee .kicker { color: var(--gold); }
        .guarantee-h { color: var(--ivory); font-size: clamp(32px, 4.4vw, 60px); margin: 22px 0 24px; }
        .guarantee .ch-body { color: rgba(244,239,231,0.7); }

        @media (max-width: 880px) {
          .hero-grid { grid-template-columns: 1fr; min-height: 0; }
          .hero-art { order: -1; min-height: 54vh; }
          .hero-copy { padding: clamp(40px, 7vh, 64px) 24px clamp(48px, 8vh, 72px); }
          .hero-sub { max-width: none; }
          .icon, .set { grid-template-columns: 1fr; gap: 36px; }
          .icon-art, .set-art { order: -1; max-width: 360px; margin: 0 auto; }
          .actives-grid, .proof-grid { grid-template-columns: 1fr; gap: 44px; max-width: 380px; }
        }
      `}</style>
    </StoreLayout>
  );
}
