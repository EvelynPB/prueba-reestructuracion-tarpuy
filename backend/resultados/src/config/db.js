/**
 * Conexión a PostgreSQL con el driver estándar `pg` (funciona con PostgreSQL local, Neon u otro proveedor).
 * Se usan dos pools con roles distintos para aplicar el principio de mínimo privilegio:
 * el público solo lee vistas y el panel solo toca las columnas que necesita.
 * Los pools se crean la primera vez que se usan.
 */
import pg from 'pg';
import { urlLector, urlAdmin } from './env.js';

const crearPool = url => new pg.Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30000 });

let _lector, _admin;
export const poolLector = () => (_lector ??= crearPool(urlLector()));
export const poolAdmin = () => (_admin ??= crearPool(urlAdmin()));

/** Ejecuta una consulta `{ text, values }` y devuelve sus filas. */
export async function filas(pool, q) {
  return (await pool.query(q)).rows;
}

/** Ejecuta varias consultas en una sola transacción: se guardan todas o ninguna. */
export async function transaccion(pool, consultas) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const q of consultas) await client.query(q);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
