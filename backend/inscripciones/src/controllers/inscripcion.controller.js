'use strict';
/** Controladores públicos: POST /api/fichas y POST /api/libres. */
const servicio = require('../services/inscripcion.service');

async function crearFicha(req, res) {
  res.status(201).json(await servicio.registrarFicha(req.body));
}

async function crearLibre(req, res) {
  res.status(201).json(await servicio.registrarLibre(req.body));
}

module.exports = { crearFicha, crearLibre };
