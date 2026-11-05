'use strict';
/**
 * Sesión del organizador: cookie `adm` firmada con HMAC-SHA256 (HttpOnly, SameSite=Strict, Secure en producción).
 * Las rutas protegidas responden 401 sin una sesión válida.
 */
const crypto = require('crypto');
const { SESSION_SECRET, IS_PROD } = require('../config/env');

const DURACION_MS = 12 * 3600 * 1000; // 12 horas

const sign = (v) => crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('hex');
const sameStr = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
function cookies(req) {
  const out = {};
  for (const p of (req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}
function isAdmin(req) {
  const t = cookies(req).adm;
  if (!t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sameStr(sig, sign(exp));
}
const needAdmin = (req, res, next) => isAdmin(req) ? next() : res.status(401).json({ error: 'No autorizado' });

function abrirSesion(res) {
  const exp = String(Date.now() + DURACION_MS);
  res.set('Set-Cookie', `adm=${exp}.${sign(exp)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${IS_PROD ? '; Secure' : ''}`);
}
function cerrarSesion(res) {
  res.set('Set-Cookie', `adm=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${IS_PROD ? '; Secure' : ''}`);
}

module.exports = { sameStr, needAdmin, abrirSesion, cerrarSesion };
