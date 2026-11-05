/** Publicación de resultados (tabla config_resultados, una sola fila). */
import { poolAdmin, filas } from '../config/db.js';

export async function leerPublicado() {
  const [c] = await filas(poolAdmin(), { text: 'SELECT publicado FROM config_resultados WHERE id = 1' });
  return !!c?.publicado;
}

export async function cambiarPublicado(publicado) {
  await filas(poolAdmin(), { text: 'UPDATE config_resultados SET publicado = $1 WHERE id = 1', values: [publicado] });
}
