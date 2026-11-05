'use strict';
/** Rutas a las carpetas compartidas del repositorio (frontend y scripts de base de datos). */
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..', '..', '..');

module.exports = {
  RAIZ,
  // Carpeta que genera «npm run build» en frontend/inscripciones (React + Tailwind)
  FRONTEND: path.join(RAIZ, 'frontend', 'inscripciones', 'dist'),
  SCHEMA_SQL: path.join(RAIZ, 'database', 'scripts', '01_inscripciones.sql'),
};
