'use strict';
/** Crea o actualiza las tablas al arrancar, usando database/scripts/01_inscripciones.sql. */
const fs = require('fs');
const pool = require('../config/db');
const { SCHEMA_SQL } = require('../config/paths');

async function prepararEsquema() {
  await pool.query(fs.readFileSync(SCHEMA_SQL, 'utf8'));
}

async function ping() {
  await pool.query('SELECT 1');
}

module.exports = { prepararEsquema, ping };
