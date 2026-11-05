/** Funciones puras de normalización (texto, grados, horas, DNI y puntajes). */
import { GRADOS_VALIDOS } from '../config/catalogo.js';

export const quitarTildes = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Puntaje máximo según el nivel: 200 en Inicial y 150 en Primaria y Secundaria. */
export const maximoDe = nivel => (quitarTildes(nivel).includes('inicial') ? 200 : 150);

/** Convierte un par nivel/grado escrito de cualquier forma a una clave (I4…S5), o null si no es válido. */
export function claveGrado(nivel, grado) {
  const n = quitarTildes(nivel), g = quitarTildes(grado);
  const cn = n.includes('inicial') ? 'I' : n.includes('primaria') ? 'P' : n.includes('secundaria') ? 'S' : null;
  const cg = g.includes('secundaria') ? 'S' : g.includes('primaria') ? 'P' : /ano/.test(g) ? 'I' : null;
  const num = (g.match(/\d+/) || [])[0];
  if (!cn || cn !== cg || !num) return null;
  const clave = cn + num;
  return GRADOS_VALIDOS.has(clave) ? clave : null;
}

/** Hora de entrega en formato HH:MM o HH:MM:SS → HH:MM:SS, o null. */
export function horaValida(h) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(h || '');
  if (!m) return null;
  const [hh, mm, ss] = [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
  if (hh > 23 || mm > 59 || ss > 59) return null;
  const p = n => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}`;
}

/* ---------- Normalización para importar desde Excel o CSV ---------- */
export const normDni = v => {
  let t = String(v ?? '').trim().replace(/\.0+$/, '').replace(/[\s.\-]/g, '');
  if (/^\d{1,7}$/.test(t)) t = t.padStart(8, '0');          // Excel quita los ceros iniciales
  return t.toUpperCase();
};
export function normHora(v) {
  if (v === null || v === undefined || v === '') return null;
  const pad = n => String(n).padStart(2, '0');
  const deSeg = t => `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  if (typeof v === 'number') {                                // Excel guarda la hora como fracción del día
    if (!Number.isFinite(v) || v < 0) return null;
    return deSeg(Math.round((v % 1) * 86400) % 86400);
  }
  const t = String(v).trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?(am|pm|a m|p m))?$/.exec(t);
  if (!m) return null;
  let hh = Number(m[1]); const mm = Number(m[2]), ss = Number(m[3] || 0);
  if (m[4]) {
    if (hh < 1 || hh > 12) return null;
    const pm = m[4][0] === 'p';
    if (pm && hh < 12) hh += 12;
    if (!pm && hh === 12) hh = 0;
  }
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}
export const normPuntaje = v => (typeof v === 'number' ? v : (String(v ?? '').trim() === '' ? NaN : Number(String(v).trim().replace(',', '.'))));
