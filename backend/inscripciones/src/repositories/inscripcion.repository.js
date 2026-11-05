'use strict';
/** Acceso a datos de las inscripciones (fichas de delegación, asesores, alumnos y alumnos libres). */
const pool = require('../config/db');

/**
 * Guarda una ficha con sus asesores y alumnos en una sola transacción.
 * Si algún DNI ya existe (en delegaciones o en alumnos libres) no guarda nada
 * y devuelve la lista de DNI duplicados.
 */
async function crearFicha(ficha, asesores, alumnos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dnis = alumnos.map(a => a.dni);
    const dup = await client.query(
      `SELECT dni FROM alumnos WHERE dni = ANY($1) UNION SELECT dni FROM libres WHERE dni = ANY($1)`, [dnis]);
    if (dup.rowCount) {
      await client.query('ROLLBACK');
      return { duplicados: dup.rows.map(r => r.dni) };
    }
    const f = await client.query(
      `INSERT INTO fichas (ie,director,tipo,direccion,telefono,correo,monto,operacion,medio,pagador)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [ficha.ie, ficha.director, ficha.tipo, ficha.direccion, ficha.tel, ficha.correo,
        ficha.monto, ficha.operacion, ficha.medio, ficha.pagador || null]);
    const id = f.rows[0].id;
    for (const a of asesores) {
      await client.query('INSERT INTO asesores (ficha_id,nivel,nombre,telefono) VALUES ($1,$2,$3,$4)', [id, a.nivel, a.nombre, a.tel]);
    }
    await client.query(
      `INSERT INTO alumnos (ficha_id,nivel,grado,nro,dni,nombre)
       SELECT $1, * FROM unnest($2::text[],$3::text[],$4::int[],$5::text[],$6::text[])`,
      [id, alumnos.map(a => a.nivel), alumnos.map(a => a.grado), alumnos.map(a => a.nro), dnis, alumnos.map(a => a.nombre)]);
    await client.query('COMMIT');
    return { id };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
}

async function existeDni(dni) {
  const dup = await pool.query(`SELECT 1 FROM alumnos WHERE dni=$1 UNION SELECT 1 FROM libres WHERE dni=$1`, [dni]);
  return dup.rowCount > 0;
}

async function crearLibre(l) {
  const r = await pool.query(
    `INSERT INTO libres (dni,grado,nivel,nombre,telefono,monto,operacion,medio,pagador)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [l.dni, l.grado, l.nivel, l.nombre, l.tel, l.monto, l.operacion, l.medio, l.pagador || null]);
  return r.rows[0].id;
}

module.exports = { crearFicha, existeDni, crearLibre };
