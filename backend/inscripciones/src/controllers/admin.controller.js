'use strict';
/** Controladores del panel del organizador (/api/admin/*). */
const servicio = require('../services/admin.service');
const { abrirSesion, cerrarSesion } = require('../middlewares/auth');

function login(req, res) {
  if (!servicio.passwordCorrecta(req.body && req.body.password)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  abrirSesion(res);
  res.json({ ok: true });
}

function logout(_req, res) {
  cerrarSesion(res);
  res.json({ ok: true });
}

async function datos(_req, res) {
  res.set('Cache-Control', 'no-store');
  res.json(await servicio.loadAll());
}

async function verificar(req, res) {
  await servicio.verificar(req.body);
  res.json({ ok: true });
}

async function exportarExcel(_req, res) {
  const wb = await servicio.generarExcel();
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="inscritos-xi-concurso-matematica-lima-este-2026.xlsx"',
    'Cache-Control': 'no-store',
  });
  await wb.xlsx.write(res);
  res.end();
}

module.exports = { login, logout, datos, verificar, exportarExcel };
