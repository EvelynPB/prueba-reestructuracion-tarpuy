'use strict';
/**
 * XI Concurso Nacional de Matemática Lima Este 2026 · Tarpuy
 * Servidor de inscripciones (Express + Postgres/Neon)
 *
 * Punto de entrada: prepara las tablas y levanta la API.
 * La lógica está organizada por capas en src/ (config, routes, controllers, services, repositories).
 */
const { PORT } = require('./src/config/env');
const app = require('./src/app');
const { prepararEsquema } = require('./src/repositories/schema.repository');

(async () => {
  await prepararEsquema();
  app.listen(PORT, '0.0.0.0', () => console.log(`Concurso Tarpuy escuchando en :${PORT}`));
})().catch(e => { console.error('No se pudo iniciar:', e.message); process.exit(1); });
