/** Controladores públicos (solo lectura): /health, /api/resultados y /api/ranking-colegios. */
import * as servicio from '../services/publico.service.js';

export const salud = (req, res) => res.send('ok');

export async function resultados(req, res) {
  try {
    res.json(await servicio.resultados());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer los resultados' });
  }
}

export async function rankingColegios(req, res) {
  try {
    res.json(await servicio.rankingColegios());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer el ranking de delegaciones' });
  }
}
