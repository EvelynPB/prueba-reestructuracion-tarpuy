/**
 * Clave del panel enviada en la cabecera `x-admin-key`, con límite de intentos por IP
 * (5 fallos → bloqueo de 10 minutos, respuesta 429).
 */
import { timingSafeEqual } from 'node:crypto';
import { adminPassword } from '../config/env.js';

const fallos = new Map(); // ip -> { n, hasta }

export function autorizado(req, res) {
  const ip = req.ip;
  const f = fallos.get(ip);
  if (f && f.n >= 5 && f.hasta > Date.now()) {
    res.status(429).json({ error: 'Demasiados intentos. Espera 10 minutos.' });
    return false;
  }
  const a = Buffer.from(req.get('x-admin-key') || '');
  const b = Buffer.from(adminPassword());
  const ok = b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
  if (ok) { fallos.delete(ip); return true; }
  const n = (f && f.hasta > Date.now() ? f.n : 0) + 1;
  fallos.set(ip, { n, hasta: Date.now() + 10 * 60 * 1000 });
  res.status(401).json({ error: 'Clave incorrecta' });
  return false;
}

/** Versión middleware: deja pasar solo si la clave es correcta. */
export const requiereClave = (req, res, next) => { if (autorizado(req, res)) next(); };
