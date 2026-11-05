'use strict';
/** Rutas públicas de inscripción. */
const { Router } = require('express');
const { writeLimiter } = require('../middlewares/seguridad');
const { wrap } = require('../utils/http-error');
const c = require('../controllers/inscripcion.controller');

const router = Router();
router.post('/fichas', writeLimiter, wrap(c.crearFicha));
router.post('/libres', writeLimiter, wrap(c.crearLibre));

module.exports = router;
