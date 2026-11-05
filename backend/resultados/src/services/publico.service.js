/** Resultados públicos y ranking de delegaciones, con caché de 8 segundos. */
import * as repo from '../repositories/publico.repository.js';
import { cache, cacheCol, vigente, guardar } from './cache.service.js';

export async function resultados() {
  if (vigente(cache)) return cache.body;
  const publicado = await repo.leerPublicado();
  const filas = await repo.leerResultados();
  return guardar(cache, {
    publicado,
    datos: filas.map(f => ({
      ...f,
      puntaje: f.puntaje === null ? null : Number(f.puntaje),
      merito: f.merito === null ? null : Number(f.merito),
      merito_general: f.merito_general === null ? null : Number(f.merito_general),
      maximo: Number(f.maximo),
      porcentaje: f.porcentaje === null ? null : Number(f.porcentaje),
    })),
  });
}

export async function rankingColegios() {
  if (vigente(cacheCol)) return cacheCol.body;
  const filas = await repo.leerRankingColegios();
  const num = v => (v === null || v === undefined ? null : Number(v));
  return guardar(cacheCol, {
    datos: filas.map(f => ({
      puesto: Number(f.puesto), colegio: f.colegio,
      inicial: num(f.inicial), primaria: num(f.primaria), secundaria: num(f.secundaria),
      inicial_pts: num(f.inicial_pts), primaria_pts: num(f.primaria_pts), secundaria_pts: num(f.secundaria_pts),
      acumulado: num(f.acumulado), promedio: num(f.promedio),
      rindieron: Number(f.rindieron), inscritos: Number(f.inscritos),
    })),
  });
}
