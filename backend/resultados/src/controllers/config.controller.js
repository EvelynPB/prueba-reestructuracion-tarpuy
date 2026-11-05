/** Publicar u ocultar los resultados (RN-07). */
import * as repo from '../repositories/config.repository.js';
import { invalidar } from '../services/cache.service.js';

export async function leer(req, res) {
  try {
    res.json({ publicado: await repo.leerPublicado() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer el estado de publicación' });
  }
}

export async function cambiar(req, res) {
  const publicado = !!req.body.publicado;
  try {
    await repo.cambiarPublicado(publicado);
    invalidar();
    res.json({ publicado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo cambiar la publicación' });
  }
}
