/** Búsqueda de participantes y registro de puntajes: individual, en lote e importación por archivo. */
import * as alumnos from '../repositories/alumnos.repository.js';
import * as puntajes from '../repositories/puntajes.repository.js';
import { analizarImportacion, guardarImportacion } from '../services/importacion.service.js';
import { invalidar } from '../services/cache.service.js';
import { horaValida, maximoDe } from '../utils/normalizar.js';

const conPuntajeNumerico = filas => filas.map(d => ({ ...d, puntaje: d.puntaje === null ? null : Number(d.puntaje) }));

export async function buscar(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ datos: [] });
  const patron = `%${q}%`;
  try {
    res.json({ datos: conPuntajeNumerico(await alumnos.buscar(patron)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar' });
  }
}

export async function inscritos(req, res) {
  try {
    res.json({ datos: conPuntajeNumerico(await alumnos.inscritos()) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer la lista de inscritos' });
  }
}

export async function guardar(req, res) {
  const { tipo, id, puntaje, hora } = req.body;
  const pts = Number(puntaje);
  const h = horaValida(hora);
  if (!Number.isInteger(id) || !['DELEGACION', 'LIBRE'].includes(tipo))
    return res.status(400).json({ error: 'Alumno no válido' });
  if (puntaje === '' || !Number.isFinite(pts) || pts < -100)
    return res.status(400).json({ error: 'El puntaje no es válido' });
  if (!h) return res.status(400).json({ error: 'La hora debe tener formato HH:MM o HH:MM:SS' });
  try {
    const nivel = await alumnos.nivelDe(tipo, id);
    if (!nivel) return res.status(404).json({ error: 'Alumno no encontrado' });
    const maximo = maximoDe(nivel);
    if (pts > maximo) return res.status(400).json({ error: `El puntaje máximo en ${nivel} es ${maximo}` });
    await puntajes.upsert(tipo, id, pts, h);
    invalidar();
    res.json({ ok: true, hora: h });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo guardar' });
  }
}

export async function borrar(req, res) {
  const { tipo, id } = req.body;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Alumno no válido' });
  try {
    if (tipo !== 'DELEGACION' && tipo !== 'LIBRE') return res.status(400).json({ error: 'Alumno no válido' });
    await puntajes.borrar(tipo, id);
    invalidar();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo borrar' });
  }
}

export async function guardarLote(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'No hay puntajes para guardar' });
  if (items.length > 500) return res.status(400).json({ error: 'Demasiados alumnos en un solo envío' });
  try {
    const niv = await alumnos.nivelesDeTodos();
    const nivelDe = new Map(niv.map(r => [r.tipo + ':' + r.id, r.nivel]));
    const errores = [], consultas = [];
    for (const it of items) {
      const nivel = nivelDe.get(`${it.tipo}:${it.id}`);
      const pts = Number(it.puntaje), h = horaValida(it.hora);
      const maximo = maximoDe(nivel);
      let msg = null;
      if (!nivel) msg = 'Alumno no encontrado';
      else if (it.puntaje === '' || it.puntaje === null || it.puntaje === undefined || !Number.isFinite(pts) || pts < -100) msg = 'Puntaje no válido';
      else if (pts > maximo) msg = `El puntaje máximo es ${maximo}`;
      else if (!h) msg = 'Hora no válida';
      if (msg) { errores.push({ tipo: it.tipo, id: it.id, error: msg }); continue; }
      consultas.push(puntajes.upsert(it.tipo === 'DELEGACION' ? 'DELEGACION' : 'LIBRE', it.id, pts, h));
    }
    if (errores.length)
      return res.status(400).json({ error: `Hay ${errores.length} alumno(s) con datos incorrectos. No se guardó nada.`, errores });
    await puntajes.transaccion(consultas);            // todo o nada
    invalidar();
    res.json({ ok: true, guardados: consultas.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo guardar. Intenta de nuevo.' });
  }
}

export async function importar(req, res) {
  const filas = Array.isArray(req.body.filas) ? req.body.filas : [];
  if (!filas.length) return res.status(400).json({ error: 'El archivo no tiene filas con datos' });
  if (filas.length > 3000) return res.status(400).json({ error: 'El archivo tiene demasiadas filas (máximo 3000)' });
  try {
    const r = await analizarImportacion(filas);
    if (req.body.modo !== 'guardar') return res.json(r);
    if (r.errores.length) return res.status(400).json({ error: 'El archivo tiene filas con errores. Corrígelo y súbelo otra vez. No se importó nada.', ...r });
    if (!r.validas.length) return res.status(400).json({ error: 'No hay puntajes para importar', ...r });
    await guardarImportacion(r);
    invalidar();
    res.json({ ok: true, guardados: r.validas.length, ...r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo procesar el archivo. Intenta de nuevo.' });
  }
}
