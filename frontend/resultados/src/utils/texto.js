/** Utilidades de texto compartidas por la página pública y el panel. */
export const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Orden «natural» en español: 2° antes que 10°. */
export const natural = (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true });
export const unicos = a => [...new Set(a)].sort(natural);

export const nivelOrden = n => { const x = norm(n); return x.includes('inicial') ? 0 : x.includes('primaria') ? 1 : x.includes('secundaria') ? 2 : 3; };
export const nivelCat = n => { const x = norm(n); return x.includes('inicial') ? 'Inicial' : x.includes('primaria') ? 'Primaria' : x.includes('secundaria') ? 'Secundaria' : n; };

/** Puntaje máximo: 200 en Inicial, 150 en Primaria y Secundaria. */
export const maxNivel = n => (norm(n).includes('inicial') ? 200 : 150);

export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
export const cx = (...c) => c.filter(Boolean).join(' ');
