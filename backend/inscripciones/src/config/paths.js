'use strict';
/** Rutas a las carpetas compartidas del repositorio (frontend y scripts de base de datos). */
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..', '..', '..');

module.exports = {
  RAIZ,
  FRONTEND: path.join(RAIZ, 'frontend', 'inscripciones'),
  SCHEMA_SQL: path.join(RAIZ, 'database', 'scripts', '01_inscripciones.sql'),
};
