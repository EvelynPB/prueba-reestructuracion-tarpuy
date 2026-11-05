/**
 * Variables de entorno del Sistema de Resultados (en producción se cargan con `fly secrets set`).
 * - DATABASE_URL_LECTOR: rol resultados_lector (solo lectura) para la página pública.
 * - DATABASE_URL_ADMIN:  rol resultados_admin (permisos limitados) para el panel de carga.
 * - DATABASE_URL:        opcional; si falta alguna de las dos anteriores se usa esta
 *                        (cómodo en desarrollo, pero pierde la separación de privilegios).
 * - ADMIN_PASSWORD:      clave del panel (se lee en cada petición).
 */
export const PORT = process.env.PORT || 3000;
export const adminPassword = () => process.env.ADMIN_PASSWORD || '';
export const urlLector = () => process.env.DATABASE_URL_LECTOR || process.env.DATABASE_URL;
export const urlAdmin = () => process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL;
