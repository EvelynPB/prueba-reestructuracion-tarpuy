'use strict';
/** Configuración de la aplicación Express del Sistema de Inscripciones. */
const express = require('express');
const { FRONTEND } = require('./config/paths');
const { cabecerasSeguridad } = require('./middlewares/seguridad');
const { apiNoEncontrada, manejadorErrores } = require('./middlewares/errores');
const { healthz } = require('./controllers/salud.controller');
const inscripcionRoutes = require('./routes/inscripcion.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.set('trust proxy', 1); // Fly.io está detrás de un proxy
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use(cabecerasSeguridad);

app.get('/healthz', healthz);
app.use('/api', inscripcionRoutes);
app.use('/api/admin', adminRoutes);

// Frontend estático (frontend/inscripciones) y errores
app.use(express.static(FRONTEND, { maxAge: '1h' }));
app.use('/api', apiNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
