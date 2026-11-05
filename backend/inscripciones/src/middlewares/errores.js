'use strict';
/** Respuesta 404 para la API y manejador central de errores. */
const { HttpError } = require('../utils/http-error');

const apiNoEncontrada = (_req, res) => res.status(404).json({ error: 'No encontrado' });

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Solicitud no válida.' });
  console.error(err);
  res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo en un momento.' });
}

module.exports = { apiNoEncontrada, manejadorErrores };
