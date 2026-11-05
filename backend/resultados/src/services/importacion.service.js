/** Análisis de un archivo de puntajes (Excel/CSV ya convertido a filas en el navegador), asignados por DNI. */
import { normDni, normHora, normPuntaje, maximoDe } from '../utils/normalizar.js';
import * as alumnosRepo from '../repositories/alumnos.repository.js';
import * as puntajesRepo from '../repositories/puntajes.repository.js';

export async function analizarImportacion(filas) {
  const alumnos = await alumnosRepo.todosParaImportar();
  const previos = await puntajesRepo.previos();
  const porDni = new Map(alumnos.map(a => [normDni(a.dni), a]));
  const antes = new Map(previos.map(r => [r.tipo + ':' + r.id, { puntaje: Number(r.puntaje), hora: r.hora_entrega }]));

  const veces = new Map();
  for (const f of filas) { const d = normDni(f.dni); if (d) veces.set(d, [...(veces.get(d) || []), f.fila]); }

  const validas = [], noEncontrados = [], errores = [];
  for (const f of filas) {
    const dni = normDni(f.dni), fila = f.fila;
    if (!dni) { errores.push({ fila, dni: '', error: 'Falta el DNI' }); continue; }
    if (!/^[0-9A-Z]{8,12}$/.test(dni)) { errores.push({ fila, dni: String(f.dni), error: 'DNI no válido' }); continue; }
    if (veces.get(dni).length > 1) { errores.push({ fila, dni, error: `DNI repetido en el archivo (filas ${veces.get(dni).join(', ')})` }); continue; }
    const al = porDni.get(dni);
    if (!al) { noEncontrados.push({ fila, dni }); continue; }
    const pts = normPuntaje(f.puntaje), hora = normHora(f.hora);
    const maximo = maximoDe(al.nivel);
    let error = null;
    if (!Number.isFinite(pts)) error = 'Puntaje no válido';
    else if (!Number.isInteger(pts)) error = 'El puntaje debe ser un número entero';
    else if (pts > maximo) error = `El puntaje máximo en ${al.nivel} es ${maximo}`;
    else if (pts < -100) error = 'Puntaje demasiado bajo';
    else if (!hora) error = 'Hora no válida (usa HH:MM:SS)';
    if (error) { errores.push({ fila, dni, error }); continue; }
    validas.push({ fila, tipo: al.tipo, id: al.id, dni, nombre: al.nombre, colegio: al.colegio, nivel: al.nivel, grado: al.grado,
                   puntaje: pts, hora, antes: antes.get(al.tipo + ':' + al.id) || null });
  }
  const enArchivo = new Set(validas.map(v => v.tipo + ':' + v.id));
  const sinResultado = alumnos.filter(a => !antes.has(a.tipo + ':' + a.id) && !enArchivo.has(a.tipo + ':' + a.id)).length;
  return {
    resumen: { leidas: filas.length, listas: validas.length, nuevas: validas.filter(v => !v.antes).length,
               reemplazan: validas.filter(v => v.antes).length, noEncontrados: noEncontrados.length,
               conErrores: errores.length, sinResultado },
    validas, noEncontrados, errores,
  };
}

/** Guarda en una sola transacción todas las filas válidas del análisis. */
export async function guardarImportacion(r) {
  const paquete = tipo => JSON.stringify(r.validas.filter(v => v.tipo === tipo).map(v => ({ id: v.id, p: v.puntaje, h: v.hora })));
  const consultas = [];
  if (r.validas.some(v => v.tipo === 'DELEGACION')) consultas.push(puntajesRepo.upsertMasivo('DELEGACION', paquete('DELEGACION')));
  if (r.validas.some(v => v.tipo === 'LIBRE')) consultas.push(puntajesRepo.upsertMasivo('LIBRE', paquete('LIBRE')));
  await puntajesRepo.transaccion(consultas);                 // todo o nada
}
