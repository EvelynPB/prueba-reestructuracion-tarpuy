'use strict';
/** Acceso a datos del panel del organizador. */
const pool = require('../config/db');

async function leerTodo() {
  const [f, as, al, li] = await Promise.all([
    pool.query('SELECT * FROM fichas ORDER BY id'),
    pool.query('SELECT * FROM asesores ORDER BY id'),
    pool.query('SELECT * FROM alumnos ORDER BY ficha_id, id'),
    pool.query('SELECT * FROM libres ORDER BY id'),
  ]);
  return { fichas: f.rows, asesores: as.rows, alumnos: al.rows, libres: li.rows };
}

/** `tabla` solo puede ser 'fichas' o 'libres' (lo valida el servicio antes de llamar). */
async function marcarVerificado(tabla, id, valor) {
  await pool.query(`UPDATE ${tabla} SET verificado = $1 WHERE id = $2`, [valor, id]);
}

module.exports = { leerTodo, marcarVerificado };
