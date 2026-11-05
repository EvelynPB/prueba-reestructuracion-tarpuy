/** Incorporación de participantes de último momento desde el panel (a una delegación o como alumno libre). */
import * as alumnos from '../repositories/alumnos.repository.js';
import { resolverNivelGrado } from '../services/inscripcion.service.js';
import { MEDIOS } from '../config/catalogo.js';

const medioValido = v => MEDIOS.find(m => m.toLowerCase() === String(v || '').trim().toLowerCase());

export async function colegios(req, res) {
  const q = String(req.query.q || '').trim();
  const patron = `%${q}%`;
  try {
    res.json({ datos: await alumnos.colegios(patron) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar colegios' });
  }
}

export async function opciones(req, res) {
  try {
    const datos = await alumnos.paresNivelGrado();
    let medios = [];
    try {
      medios = await alumnos.mediosUsados();
    } catch { /* si aún no hay permiso, el medio de pago se escribe a mano */ }
    res.json({ datos, medios });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al leer niveles y grados' });
  }
}

export async function agregarAlumno(req, res) {
  const { ficha_id, nivel, grado } = req.body;
  const monto = Number(req.body.monto);
  let operacion = String(req.body.operacion || '').trim();
  const medio = medioValido(req.body.medio);
  const dni = String(req.body.dni || '').trim();
  const nombre = String(req.body.nombre || '').trim().replace(/\s+/g, ' ');
  if (!Number.isInteger(ficha_id)) return res.status(400).json({ error: 'Elige un colegio' });
  if (!Number.isInteger(monto) || monto < 0 || monto > 100000) return res.status(400).json({ error: 'El monto debe ser un número entero' });
  if (!medio) return res.status(400).json({ error: 'Elige un medio de pago válido' });
  if (!operacion && medio === 'Efectivo') operacion = 'EFECTIVO';
  if (!operacion || operacion.length > 60) return res.status(400).json({ error: 'Escribe el número de operación' });
  if (!nivel || !grado) return res.status(400).json({ error: 'Elige nivel y grado' });
  if (!/^[0-9A-Za-z]{8,12}$/.test(dni)) return res.status(400).json({ error: 'El DNI debe tener entre 8 y 12 caracteres, sin espacios' });
  if (nombre.length < 5 || nombre.length > 120) return res.status(400).json({ error: 'Escribe los apellidos y nombres completos' });
  try {
    const f = await alumnos.colegioPorId(ficha_id);
    if (!f) return res.status(400).json({ error: 'Colegio no encontrado' });
    const ng = await resolverNivelGrado(nivel, grado);
    if (!ng) return res.status(400).json({ error: 'El grado no corresponde al nivel elegido' });
    const dup = await alumnos.buscarPorDni(dni);
    if (dup) return res.status(409).json({ error: `Ese DNI ya está inscrito (${dup.nombre}).` });
    const n = await alumnos.agregarAlumnoADelegacion({ ficha_id, nivel: ng.nivel, grado: ng.grado, dni, nombre, monto, medio, operacion });
    res.json({ ok: true, id: n.id, nro: n.nro, colegio: f.ie, nombre, dni, monto_ficha: n.monto_ficha });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo agregar el alumno' });
  }
}

export async function agregarLibre(req, res) {
  const { nivel, grado } = req.body;
  const dni = String(req.body.dni || '').trim();
  const nombre = String(req.body.nombre || '').trim().replace(/\s+/g, ' ');
  const monto = Number(req.body.monto);
  let operacion = String(req.body.operacion || '').trim();
  const medio = medioValido(req.body.medio);
  const pagador = String(req.body.pagador || '').trim().replace(/\s+/g, ' ');
  const telefono = String(req.body.telefono || '').trim();
  const verificado = !!req.body.verificado;
  if (!nivel || !grado) return res.status(400).json({ error: 'Elige nivel y grado' });
  if (!/^[0-9A-Za-z]{8,12}$/.test(dni)) return res.status(400).json({ error: 'El DNI debe tener entre 8 y 12 caracteres, sin espacios' });
  if (nombre.length < 5 || nombre.length > 120) return res.status(400).json({ error: 'Escribe los apellidos y nombres completos' });
  if (!Number.isInteger(monto) || monto < 0) return res.status(400).json({ error: 'El monto debe ser un número entero' });
  if (!medio) return res.status(400).json({ error: 'Elige un medio de pago válido' });
  if (!operacion && medio === 'Efectivo') operacion = 'EFECTIVO';
  if (!operacion || operacion.length > 60) return res.status(400).json({ error: 'Escribe el número de operación' });
  if (pagador.length < 3 || pagador.length > 120) return res.status(400).json({ error: 'Escribe el nombre del pagador' });
  if (!/^[0-9+\-\s]{7,20}$/.test(telefono)) return res.status(400).json({ error: 'Escribe un teléfono válido (solo números, entre 7 y 20 caracteres)' });
  try {
    const ng = await resolverNivelGrado(nivel, grado);
    if (!ng) return res.status(400).json({ error: 'El grado no corresponde al nivel elegido' });
    const dup = await alumnos.buscarPorDni(dni);
    if (dup) return res.status(409).json({ error: `Ese DNI ya está inscrito (${dup.nombre}).` });
    const n = await alumnos.agregarLibre({ dni, grado: ng.grado, nivel: ng.nivel, nombre, monto, operacion, medio, pagador, verificado, telefono });
    res.json({ ok: true, id: n.id, nombre, dni });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo agregar el alumno libre' });
  }
}
