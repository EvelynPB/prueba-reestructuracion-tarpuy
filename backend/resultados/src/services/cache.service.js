/** Caché en memoria (8 s) de las respuestas públicas, para no consultar la base en cada visita. */
const DURACION_MS = 8000;
export const cache = { t: 0, body: null };
export const cacheCol = { t: 0, body: null };

export const vigente = c => c.body && Date.now() - c.t < DURACION_MS;
export function guardar(c, body) { c.t = Date.now(); c.body = body; return body; }

/** Se llama después de cualquier cambio de puntajes o de publicación. */
export function invalidar() { cache.t = 0; cacheCol.t = 0; }
