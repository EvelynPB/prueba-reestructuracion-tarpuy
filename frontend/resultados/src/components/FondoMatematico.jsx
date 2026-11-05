import { useEffect, useMemo, useRef } from 'react';

const SIMBOLOS = ['f(x)', 'sin θ', '∫f(x)dx', '∠90°', 'Σ', 'lim x→∞', 'x²+y²=r²', 'n!', '√', '∞', '×', '≈', 'π', 'Δ', 'cos θ',
  'a²+b²=c²', 'log x', '÷', '%', 'θ'];

/** Fondo de la página pública: red de puntos en un canvas y símbolos que suben. */
export default function FondoMatematico() {
  const canvas = useRef(null);

  const simbolos = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    texto: SIMBOLOS[i % SIMBOLOS.length],
    estilo: {
      left: Math.random() * 92 + 'vw',
      top: Math.random() * 110 + 'vh',
      fontSize: 1.3 + Math.random() * 2.2 + 'rem',
      '--d': 28 + Math.random() * 30 + 's',
      '--r': 6 + Math.random() * 6 + 's',
      '--a': Math.random() * 24 - 12 + 'deg',
      animationDelay: -Math.random() * 40 + 's,' + -Math.random() * 8 + 's',
    },
  })), []);

  useEffect(() => {
    const c = canvas.current, x = c.getContext('2d'), P = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W, H, marco;
    function medir() {
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 16000));
      while (P.length < n) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: Math.random() * 1.6 + 0.8 });
      P.length = n;
    }
    function paso() {
      x.clearRect(0, 0, W, H); const D = 150;
      for (let i = 0; i < P.length; i++) {
        const a = P[i];
        if (!reducir) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (let j = i + 1; j < P.length; j++) {
          const b = P[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) { x.strokeStyle = 'rgba(150,205,255,' + 0.3 * (1 - d / D) + ')'; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
        }
        x.fillStyle = 'rgba(190,235,255,.9)'; x.shadowColor = '#8fe0ff'; x.shadowBlur = 8;
        x.beginPath(); x.arc(a.x, a.y, a.r, 0, 7); x.fill(); x.shadowBlur = 0;
      }
      if (!reducir) marco = requestAnimationFrame(paso);
    }
    medir(); window.addEventListener('resize', medir); paso();
    return () => { cancelAnimationFrame(marco); window.removeEventListener('resize', medir); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {simbolos.map(s => (
        <span key={s.id} style={s.estilo}
          className="absolute animate-simbolo font-exo font-extrabold whitespace-nowrap text-[rgba(150,205,255,.28)] will-change-transform [text-shadow:0_0_14px_rgba(120,200,255,.55)]">
          {s.texto}
        </span>
      ))}
    </div>
  );
}
