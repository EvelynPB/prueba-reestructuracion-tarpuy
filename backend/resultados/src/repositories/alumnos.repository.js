/**
 * Consultas del panel sobre los inscritos (tablas alumnos, libres y fichas del Sistema de Inscripciones).
 * El rol resultados_admin solo puede usar las columnas necesarias (ver database/scripts/03_roles.sql).
 * Todas las consultas son parametrizadas ($1, $2…): los datos nunca se concatenan en el SQL.
 */
import { poolAdmin, filas } from '../config/db.js';

const q = (text, values = []) => filas(poolAdmin(), { text, values });

export function buscar(patron) {
  return q(`
    SELECT * FROM (
      SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado,
             f.ie AS colegio, r.puntaje, r.hora_entrega
      FROM alumnos a
      JOIN fichas f ON f.id = a.ficha_id
      LEFT JOIN resultados r ON r.alumno_id = a.id
      WHERE unaccent(a.nombre) ILIKE unaccent($1::text) OR a.dni LIKE $1::text
      UNION ALL
      SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado,
             'Alumno libre', r.puntaje, r.hora_entrega
      FROM libres l
      LEFT JOIN resultados r ON r.libre_id = l.id
      WHERE unaccent(l.nombre) ILIKE unaccent($1::text) OR l.dni LIKE $1::text
    ) t
    ORDER BY nombre
    LIMIT 20`, [patron]);
}

export function inscritos() {
  return q(`
    SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado,
           f.ie AS colegio, r.puntaje, r.hora_entrega
    FROM alumnos a
    JOIN fichas f ON f.id = a.ficha_id
    LEFT JOIN resultados r ON r.alumno_id = a.id
    UNION ALL
    SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado,
           'Alumno libre', r.puntaje, r.hora_entrega
    FROM libres l
    LEFT JOIN resultados r ON r.libre_id = l.id
    ORDER BY nivel, grado, colegio, nombre`);
}

export async function nivelDe(tipo, id) {
  const [al] = tipo === 'DELEGACION'
    ? await q('SELECT nivel FROM alumnos WHERE id = $1', [id])
    : await q('SELECT nivel FROM libres WHERE id = $1', [id]);
  return al ? al.nivel : null;
}

export function nivelesDeTodos() {
  return q(`
    SELECT 'DELEGACION' AS tipo, id, nivel FROM alumnos
    UNION ALL
    SELECT 'LIBRE', id, nivel FROM libres`);
}

/** Todos los inscritos con datos para asignar puntajes por DNI al importar. */
export function todosParaImportar() {
  return q(`
    SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado, f.ie AS colegio
    FROM alumnos a JOIN fichas f ON f.id = a.ficha_id
    UNION ALL
    SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado, 'Alumno libre' FROM libres l`);
}

export function paresNivelGrado() {
  return q(`
    SELECT DISTINCT nivel, grado FROM (
      SELECT nivel, grado FROM alumnos
      UNION ALL
      SELECT nivel, grado FROM libres
    ) t`);
}

export async function mediosUsados() {
  return (await q(`SELECT DISTINCT medio FROM libres WHERE medio <> '' ORDER BY medio`)).map(m => m.medio);
}

export function colegios(patron) {
  return q(`
    SELECT f.id, f.ie, COUNT(a.id)::int AS alumnos
    FROM fichas f
    LEFT JOIN alumnos a ON a.ficha_id = f.id
    WHERE unaccent(f.ie) ILIKE unaccent($1::text)
    GROUP BY f.id, f.ie
    ORDER BY f.ie
    LIMIT 1000`, [patron]);
}

export async function colegioPorId(fichaId) {
  const [f] = await q('SELECT ie FROM fichas WHERE id = $1', [fichaId]);
  return f || null;
}

export async function buscarPorDni(dni) {
  const dup = await q(`
    SELECT nombre FROM alumnos WHERE dni = $1
    UNION ALL
    SELECT nombre FROM libres WHERE dni = $1
    LIMIT 1`, [dni]);
  return dup.length ? dup[0] : null;
}

/** Una sola instrucción: agrega al alumno, registra su pago y suma el monto a la ficha (todo o nada). */
export async function agregarAlumnoADelegacion({ ficha_id, nivel, grado, dni, nombre, monto, medio, operacion }) {
  const [n] = await q(`
    WITH nuevo AS (
      INSERT INTO alumnos (ficha_id, nivel, grado, nro, dni, nombre)
      SELECT $1::int, $2::text, $3::text, COALESCE(MAX(nro), 0) + 1, $4::text, $5::text
      FROM alumnos WHERE ficha_id = $1::int
      RETURNING id, nro
    ), pago AS (
      INSERT INTO pagos_adicionales (ficha_id, alumno_id, monto, medio, operacion)
      SELECT $1::int, nuevo.id, $6::int, $7::text, $8::text FROM nuevo
      RETURNING id
    ), ficha AS (
      UPDATE fichas SET monto = monto + $6::int WHERE id = $1::int
      RETURNING monto
    )
    SELECT nuevo.id, nuevo.nro, (SELECT monto FROM ficha) AS monto_ficha FROM nuevo`,
  [ficha_id, nivel, grado, dni, nombre, monto, medio, operacion]);
  return n;
}

export async function agregarLibre({ dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, telefono }) {
  const [n] = await q(`
    INSERT INTO libres (dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, created_at, telefono)
    VALUES ($1::text, $2::text, $3::text, $4::text, $5::int, $6::text, $7::text, $8::text, $9::boolean, now(), $10::text)
    RETURNING id`,
  [dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, telefono]);
  return n;
}
