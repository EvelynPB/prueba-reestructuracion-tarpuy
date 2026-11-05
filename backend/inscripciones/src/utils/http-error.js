'use strict';
/** Error con código HTTP y utilidades para controladores asíncronos. */
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (msg) => new HttpError(400, msg);

/** Envuelve un controlador async para que sus errores lleguen al manejador de errores de Express. */
function wrap(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }

module.exports = { HttpError, bad, wrap };
