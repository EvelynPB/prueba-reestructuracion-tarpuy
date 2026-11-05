'use strict';
/** Rutas del panel del organizador. Todas, salvo login y logout, exigen sesión (401 sin ella). */
const { Router } = require('express');
const { loginLimiter } = require('../middlewares/seguridad');
const { needAdmin } = require('../middlewares/auth');
const { wrap } = require('../utils/http-error');
const c = require('../controllers/admin.controller');

const router = Router();
router.post('/login', loginLimiter, c.login);
router.post('/logout', c.logout);
router.get('/data', needAdmin, wrap(c.datos));
router.patch('/verify', needAdmin, wrap(c.verificar));
router.get('/export.xlsx', needAdmin, wrap(c.exportarExcel));

module.exports = router;
