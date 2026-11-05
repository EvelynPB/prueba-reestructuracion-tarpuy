/** Consultas públicas (rol de solo lectura): vistas de resultados y ranking. */
import { sqlLector } from '../config/db.js';

export async function leerPublicado() {
  const [cfg] = await sqlLector()`SELECT publicado FROM config_resultados WHERE id = 1`;
  return !!cfg?.publicado;
}

export function leerResultados() {
  return sqlLector()`
    SELECT tipo, nombre, colegio, nivel, grado, puntaje, hora_entrega, merito, merito_general,
           rindio, maximo, porcentaje
    FROM vista_resultados
    ORDER BY merito_general NULLS LAST, nombre`;
}

export function leerRankingColegios() {
  return sqlLector()`
    SELECT puesto, colegio, inicial, primaria, secundaria, inicial_pts, primaria_pts, secundaria_pts,
           acumulado, promedio, rindieron, inscritos
    FROM vista_ranking_colegios
    ORDER BY puesto, colegio`;
}
