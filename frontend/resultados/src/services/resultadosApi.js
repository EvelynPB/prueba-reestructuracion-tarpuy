/** Llamadas públicas (sin clave) a la API del Sistema de Resultados. */

/** Devuelve { publicado, datos }. Lanza un error si el servidor responde con error. */
export async function leerResultados() {
  const r = await fetch('/api/resultados', { cache: 'no-store' });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error);
  return j;
}

/** Devuelve { ok: true, datos } o { ok: false } si el ranking de delegaciones no está disponible. */
export async function leerRankingColegios() {
  try {
    const r = await fetch('/api/ranking-colegios', { cache: 'no-store' });
    const j = await r.json();
    return r.ok ? { ok: true, datos: j.datos } : { ok: false };
  } catch {
    return { ok: false };
  }
}
