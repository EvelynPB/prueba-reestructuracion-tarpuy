'use strict';
/** Cabeceras de seguridad (RNF-03) y límites de peticiones (rate limiting). */
const rateLimit = require('express-rate-limit');

function cabecerasSeguridad(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
}

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiados envíos desde esta conexión. Espera unos minutos e inténtalo otra vez.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

module.exports = { cabecerasSeguridad, writeLimiter, loginLimiter };
