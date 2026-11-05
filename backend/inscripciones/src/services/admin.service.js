'use strict';
/** Panel del organizador: listado de inscripciones, verificación de pagos y exportación a Excel. */
const ExcelJS = require('exceljs');
const { ADMIN_PASSWORD } = require('../config/env');
const { sameStr } = require('../middlewares/auth');
const { bad } = require('../utils/http-error');
const repo = require('../repositories/admin.repository');

const passwordCorrecta = (password) => sameStr(password, ADMIN_PASSWORD);

/** Devuelve fichas (con sus asesores y alumnos) y alumnos libres en el formato que usa el panel. */
async function loadAll() {
  const { fichas: fr, asesores: as, alumnos: al, libres: li } = await repo.leerTodo();
  const fichas = fr.map(r => ({
    _id: r.id, ie: r.ie, director: r.director, tipo: r.tipo, dir: r.direccion, tel: r.telefono, mail: r.correo,
    monto: r.monto, operacion: r.operacion, medio: r.medio, pagador: r.pagador || '', verificado: r.verificado,
    fecha: r.created_at, asesores: [], alumnos: [],
  }));
  const byId = new Map(fichas.map(x => [x._id, x]));
  for (const a of as) byId.get(a.ficha_id)?.asesores.push({ nivel: a.nivel, nombre: a.nombre, tel: a.telefono });
  for (const a of al) byId.get(a.ficha_id)?.alumnos.push({ nivel: a.nivel, grado: a.grado, n: a.nro, dni: a.dni, nombre: a.nombre });
  const libres = li.map(r => ({
    _id: r.id, dni: r.dni, grado: r.grado, nivel: r.nivel, nombre: r.nombre, tel: r.telefono || '', monto: r.monto,
    operacion: r.operacion, medio: r.medio, pagador: r.pagador || '', verificado: r.verificado, fecha: r.created_at,
  }));
  return { fichas, libres };
}

async function verificar(body) {
  const { t, id, v } = body || {};
  if (!['fichas', 'libres'].includes(t) || !Number.isInteger(id)) throw bad('Datos no válidos.');
  await repo.marcarVerificado(t, id, !!v);
}

/** Crea el libro de Excel con las hojas Alumnos, Instituciones, Asesores y Alumnos libres. */
async function generarExcel() {
  const { fichas, libres } = await loadAll();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Tarpuy · XI Concurso Nacional de Matemática Lima Este 2026';
  const estado = (v) => v ? 'Verificado' : 'Pendiente';
  const sheet = (name, cols, rows) => {
    const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = cols.map(([header, key, width]) => ({ header, key, width }));
    rows.forEach(r => ws.addRow(r));
    const h = ws.getRow(1);
    h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1A5C' } };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
    return ws;
  };
  const alumnos = [], asesores = [];
  fichas.forEach(f => {
    f.alumnos.forEach(a => alumnos.push({ ie: f.ie, tipo: f.tipo, nivel: a.nivel, grado: a.grado, n: a.n, dni: a.dni, nombre: a.nombre }));
    f.asesores.forEach(a => asesores.push({ ie: f.ie, nivel: a.nivel, nombre: a.nombre, tel: a.tel }));
  });
  sheet('Alumnos', [['I.E.', 'ie', 38], ['Tipo', 'tipo', 10], ['Nivel', 'nivel', 12], ['Grado', 'grado', 18], ['N°', 'n', 6], ['DNI / Código', 'dni', 16], ['Apellidos y nombres', 'nombre', 40]], alumnos);
  sheet('Instituciones', [['N°', 'n', 6], ['Nombre de la I.E.', 'ie', 38], ['Tipo', 'tipo', 10], ['Director', 'director', 30], ['Dirección', 'dir', 36], ['Teléfono', 'tel', 12], ['Correo', 'mail', 30], ['N° alumnos', 'na', 11], ['Monto (S/)', 'monto', 11], ['Medio de pago', 'medio', 15], ['N° operación', 'operacion', 22], ['Pagó (nombre)', 'pagador', 26], ['Estado de pago', 'estado', 14], ['Fecha de registro', 'fecha', 20]],
    fichas.map((f, i) => ({ n: i + 1, ie: f.ie, tipo: f.tipo, director: f.director, dir: f.dir, tel: f.tel, mail: f.mail, na: f.alumnos.length, monto: f.monto, medio: f.medio, operacion: f.operacion, pagador: f.pagador, estado: estado(f.verificado), fecha: f.fecha })));
  sheet('Asesores', [['I.E.', 'ie', 38], ['Nivel', 'nivel', 12], ['Apellidos y nombres del asesor', 'nombre', 38], ['Teléfono', 'tel', 12]], asesores);
  sheet('Alumnos libres', [['N°', 'n', 6], ['DNI', 'dni', 12], ['Grado', 'grado', 18], ['Nivel', 'nivel', 12], ['Apellidos y nombres', 'nombre', 40],['Celular / WhatsApp', 'tel', 16],['Monto (S/)', 'monto', 11], ['Medio de pago', 'medio', 15], ['N° operación', 'operacion', 22], ['Pagó (nombre)', 'pagador', 26], ['Estado de pago', 'estado', 14], ['Fecha de registro', 'fecha', 20]],
    libres.map((r, i) => ({ n: i + 1, ...r, estado: estado(r.verificado) })));
  return wb;
}

module.exports = { passwordCorrecta, loadAll, verificar, generarExcel };
