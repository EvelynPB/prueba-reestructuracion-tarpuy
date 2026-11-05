/**
 * Conexiones a Neon (PostgreSQL) por HTTP. Se crean la primera vez que se usan.
 * Se usan dos roles distintos para aplicar el principio de mínimo privilegio.
 */
import { neon } from '@neondatabase/serverless';
import { urlLector, urlAdmin } from './env.js';

let _lector, _admin;
export const sqlLector = () => (_lector ??= neon(urlLector()));
export const sqlAdmin = () => (_admin ??= neon(urlAdmin()));
