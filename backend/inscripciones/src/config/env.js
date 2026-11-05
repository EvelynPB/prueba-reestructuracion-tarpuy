'use strict';
/**
 * Variables de entorno del Sistema de Inscripciones.
 * Los secretos (DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET) se cargan con `fly secrets set`
 * y nunca se escriben en el repositorio.
 */
const { DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
if (!DATABASE_URL || !ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error('Faltan variables de entorno: DATABASE_URL, ADMIN_PASSWORD y SESSION_SECRET son obligatorias.');
  process.exit(1);
}

module.exports = {
  DATABASE_URL,
  ADMIN_PASSWORD,
  SESSION_SECRET,
  PORT: process.env.PORT || 8080,
  P_DEL: Number(process.env.PRECIO_DELEGACION) || 13, // RN-01: S/ por alumno de delegación
  P_LIB: Number(process.env.PRECIO_LIBRE) || 15,      // RN-01: S/ por alumno libre
  IS_PROD: process.env.NODE_ENV === 'production',
};
