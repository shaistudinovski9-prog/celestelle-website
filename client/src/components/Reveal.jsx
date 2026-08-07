import { useEffect, useRef, useState } from 'react';

// Scroll-reveal primitive (ported from celestellebeauty.com). Drives animation
// via inline styles; triggers from IntersectionObserver + scroll fallback +
// in-view-on-mount check, so content can never get stuck invisible.
const EASE = 'cubic-bezier(.22,.61,.36,1)';

export default function Reveal({ as: Tag = 'div', className = '', delay = 0, variant = '', children, ...rest }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setReduced(true); setVis(true); return; }

    const inView = () => el.getBoundingClientRect().top < window.innerHeight * 0.9;
    if (inView()) { setVis(true); return; }

    let raf = 0;
    const trigger = () => { setVis(true); cleanup(); };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (inView()) trigger(); });
    };
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && trigger(), { threshold: 0, rootMargin: '0px 0px -8% 0px' })
      : null;
    io?.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    function cleanup() {
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    }
    return cleanup;
  }, []);

  let style;
  if (reduced) {
    style = {};
  } else if (variant === 'clip') {
    style = {
      clipPath: vis ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
      transition: `clip-path 1.3s cubic-bezier(.77,0,.18,1) ${delay}ms`,
      willChange: 'clip-path',
    };
  } else {
    const t = `opacity 1.1s ${EASE} ${delay}ms, transform 1.1s ${EASE} ${delay}ms`;
    style = variant === 'blur'
      ? { opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(28px)', filter: vis ? 'blur(0)' : 'blur(14px)', transition: `${t}, filter 1.4s ${EASE} ${delay}ms` }
      : { opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(28px)', transition: t };
  }

  return <Tag ref={ref} className={className} style={style} {...rest}>{children}</Tag>;
}
