/** Rutas a las carpetas compartidas del repositorio. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(aqui, '..', '..', '..', '..');
export const FRONTEND = path.join(RAIZ, 'frontend', 'resultados');
