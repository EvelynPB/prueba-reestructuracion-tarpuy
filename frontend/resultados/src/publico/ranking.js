/** Cálculos del ranking que hace el navegador (orden de las tablas y puesto general por nivel). */
import { natural, nivelCat } from '../utils/texto.js';

/**
 * Puesto general dentro de cada nivel (Inicial, Primaria, Secundaria): % del máximo más alto primero y,
 * si empatan, la hora de entrega más temprana. Quien no rindió no tiene puesto.
 */
export function conPuestoNivel(datos) {
  const filas = datos.map(d => ({ ...d, puesto_nivel: null }));
  const porNivel = new Map();
  for (const d of filas) {
    if (!d.rindio) continue;
    const k = nivelCat(d.nivel);
    if (!porNivel.has(k)) porNivel.set(k, []);
    porNivel.get(k).push(d);
  }
  porNivel.forEach(lista => {
    lista.sort((a, b) => (b.porcentaje - a.porcentaje) || natural(a.hora_entrega, b.hora_entrega));
    lista.forEach((d, i) => {
      const ant = lista[i - 1];
      d.puesto_nivel = ant && ant.porcentaje === d.porcentaje && ant.hora_entrega === d.hora_entrega ? ant.puesto_nivel : i + 1;
    });
  });
  return filas;
}

/** Ordena por la columna elegida; los alumnos que no rindieron van siempre al final. */
export function ordenar(filas, { clave, dir }) {
  const si = filas.filter(d => d.rindio !== false);
  const no = filas.filter(d => d.rindio === false);
  si.sort((a, b) => {
    let x = a[clave], y = b[clave];
    if (x == null) x = 0;
    if (y == null) y = 0;
    const c = typeof x === 'number' ? x - y : natural(x, y);
    if (c) return c * dir;
    return (b.puntaje - a.puntaje) || natural(a.hora_entrega || '', b.hora_entrega || '') || natural(a.colegio || '', b.colegio || '');
  });
  no.sort((a, b) => natural(a.nombre, b.nombre));
  return [...si, ...no];
}

export const COLS_GRADO = [['merito', 'Mérito', true], ['nombre', 'Alumno', false], ['colegio', 'Colegio', false],
  ['puntaje', 'Puntaje', true], ['hora_entrega', 'Hora de entrega', true]];
export const COLS_GENERAL = [['puesto_nivel', 'Puesto', true], ['nombre', 'Alumno', false], ['colegio', 'Colegio', false],
  ['grado', 'Grado', false], ['puntaje', 'Puntaje', true], ['porcentaje', '% del máximo', true],
  ['hora_entrega', 'Hora de entrega', true], ['merito', 'Mérito en grado', true]];
export const COLS_COLEGIOS = [['puesto', 'Puesto', true], ['colegio', 'Colegio', false], ['inicial', 'Inicial', true],
  ['primaria', 'Primaria', true], ['secundaria', 'Secundaria', true], ['acumulado', 'Acumulado', true],
  ['promedio', 'Promedio (÷ 3)', true], ['rindieron', 'Rindieron / inscritos', true]];
