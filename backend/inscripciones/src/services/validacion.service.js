'use strict';
/** Normalización y validación de los datos que llegan del formulario. */
const { bad } = require('../utils/http-error');

const clean = (v, max = 160) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** RN-05: uno o varios N.° de operación (6 a 12 dígitos), separados por comas. */
function parseOps(v) {
  const ops = clean(v, 120).split(/[,;\s]+/).filter(Boolean);
  if (!ops.length || ops.length > 6 || !ops.every(o => /^\d{6,12}$/.test(o))) {
    throw bad('El N° de operación no es válido (6 a 12 dígitos; separa varios con coma).');
  }
  return ops.join(', ');
}
function parseMedio(v) {
  if (v !== 'Yape' && v !== 'Transferencia') throw bad('Elige el medio de pago.');
  return v;
}
/** RN-04: DNI de 8 dígitos (en 5.° de Primaria se admite también el código de estudiante de 14 dígitos). */
function dniOk(dni, grado) {
  if (grado === '5° de Primaria') return /^(\d{8}|\d{14})$/.test(dni); // DNI o código de estudiante
  return /^\d{8}$/.test(dni);
}

module.exports = { clean, parseOps, parseMedio, dniOk };
