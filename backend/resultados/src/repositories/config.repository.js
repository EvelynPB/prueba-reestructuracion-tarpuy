/** Publicación de resultados (tabla config_resultados, una sola fila). */
import { sqlAdmin } from '../config/db.js';

export async function leerPublicado() {
  const [c] = await sqlAdmin()`SELECT publicado FROM config_resultados WHERE id = 1`;
  return !!c?.publicado;
}

export async function cambiarPublicado(publicado) {
  await sqlAdmin()`UPDATE config_resultados SET publicado = ${publicado} WHERE id = 1`;
}
