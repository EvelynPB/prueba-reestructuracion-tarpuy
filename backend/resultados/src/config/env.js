/**
 * Variables de entorno del Sistema de Resultados (se cargan con `fly secrets set`).
 * - DATABASE_URL_LECTOR: rol de solo lectura para la página pública.
 * - DATABASE_URL_ADMIN: rol con permisos limitados para el panel de carga.
 * - ADMIN_PASSWORD: clave del panel (se lee en cada petición).
 */
export const PORT = process.env.PORT || 3000;
export const adminPassword = () => process.env.ADMIN_PASSWORD || '';
export const urlLector = () => process.env.DATABASE_URL_LECTOR;
export const urlAdmin = () => process.env.DATABASE_URL_ADMIN;
