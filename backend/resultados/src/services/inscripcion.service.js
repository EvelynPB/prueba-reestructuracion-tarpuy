/** Reglas para inscripciones de último momento hechas desde el panel de resultados. */
import { claveGrado } from '../utils/normalizar.js';
import * as alumnos from '../repositories/alumnos.repository.js';

/** Devuelve el nivel y grado tal como ya están escritos en la base (si existen); si no, los enviados. */
export async function resolverNivelGrado(nivel, grado) {
  const clave = claveGrado(nivel, grado);
  if (!clave) return null;
  const pares = await alumnos.paresNivelGrado();
  const hit = pares.find(x => claveGrado(x.nivel, x.grado) === clave);
  return hit ? { nivel: hit.nivel, grado: hit.grado } : { nivel, grado };
}
