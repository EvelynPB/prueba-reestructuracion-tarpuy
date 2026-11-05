/** Publicar u ocultar los resultados (RN-07). */
import * as repo from '../repositories/config.repository.js';
import { invalidar } from '../services/cache.service.js';

export async function leer(req, res) {
  res.json({ publicado: await repo.leerPublicado() });
}

export async function cambiar(req, res) {
  const publicado = !!req.body.publicado;
  await repo.cambiarPublicado(publicado);
  invalidar();
  res.json({ publicado });
}
