import { useEffect, useMemo, useRef } from 'react';

const SIMBOLOS = ['π', '∑', '√', '∞', '∫', 'Δ', 'θ', '÷', '×', '≠', '≈', 'x²', 'n!', '√2', '2³=8', '7×8=56', 'sin θ', 'f(x)',
  'π≈3,14', 'a²+b²=c²', 'x²+y²=r²', 'lim x→∞', '∫ f(x)dx', '1+1=2', '∠90°', '%'];

/** Fondo: red de puntos en un canvas y símbolos matemáticos que suben flotando. */
export default function FondoAnimado() {
  const canvas = useRef(null);

  const simbolos = useMemo(() => {
    const n = window.innerWidth < 700 ? 16 : 30;
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      texto: SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)],
      estilo: {
        left: Math.random() * 92 + '%',
        fontSize: 22 + Math.random() * 48 + 'px',
        '--d': 14 + Math.random() * 20 + 's',
        '--t': -Math.random() * 34 + 's',
        '--r': ((Math.random() * 200 - 100) | 0) + 'deg',
        '--x': ((Math.random() * 160 - 80) | 0) + 'px',
      },
    }));
  }, []);

  useEffect(() => {
    const cv = canvas.current, x = cv.getContext('2d');
    let W, H, P = [], marco;
    const cantidad = () => (window.innerWidth < 700 ? 34 : 70);
    function medir() {
      const r = window.devicePixelRatio || 1;
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * r; cv.height = H * r; x.setTransform(r, 0, 0, r, 0, 0);
      P = Array.from({ length: cantidad() }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: 1 + Math.random() * 2,
      }));
    }
    function dibujar() {
      x.clearRect(0, 0, W, H);
      for (let i = 0; i < P.length; i++) {
        const a = P[i];
        for (let j = i + 1; j < P.length; j++) {
          const b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 150) {
            x.strokeStyle = `rgba(110,200,255,${0.28 * (1 - d / 150)})`; x.lineWidth = 1;
            x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
          }
        }
      }
      for (const a of P) {
        x.shadowColor = '#5bd1ff'; x.shadowBlur = 10; x.fillStyle = '#9fe8ff';
        x.beginPath(); x.arc(a.x, a.y, a.r, 0, 7); x.fill(); x.shadowBlur = 0;
      }
    }
    function paso() {
      for (const a of P) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      dibujar(); marco = requestAnimationFrame(paso);
    }
    medir();
    window.addEventListener('resize', medir);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dibujar(); else paso();
    return () => { cancelAnimationFrame(marco); window.removeEventListener('resize', medir); };
  }, []);

  return (
    <div className="fondo-animado pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {simbolos.map(s => (
        <span key={s.id} style={s.estilo}
          className="absolute -bottom-[60px] animate-simbolo whitespace-nowrap font-serif font-black text-[#8fe3ff] opacity-0 [text-shadow:0_0_14px_rgba(111,211,255,.75),0_0_30px_rgba(111,211,255,.35)]">
          {s.texto}
        </span>
      ))}
    </div>
  );
}
