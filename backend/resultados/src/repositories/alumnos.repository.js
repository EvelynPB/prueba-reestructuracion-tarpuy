/**
 * Consultas del panel sobre los inscritos (tablas alumnos, libres y fichas del Sistema de Inscripciones).
 * El rol resultados_admin solo puede leer las columnas necesarias (ver database/scripts/03_resultados_roles.sql).
 */
import { sqlAdmin } from '../config/db.js';

const sql = () => sqlAdmin();

export function buscar(patron) {
  return sql()`
    SELECT * FROM (
      SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado,
             f.ie AS colegio, r.puntaje, r.hora_entrega
      FROM alumnos a
      JOIN fichas f ON f.id = a.ficha_id
      LEFT JOIN resultados r ON r.alumno_id = a.id
      WHERE unaccent(a.nombre) ILIKE unaccent(${patron}) OR a.dni LIKE ${patron}
      UNION ALL
      SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado,
             'Alumno libre', r.puntaje, r.hora_entrega
      FROM libres l
      LEFT JOIN resultados r ON r.libre_id = l.id
      WHERE unaccent(l.nombre) ILIKE unaccent(${patron}) OR l.dni LIKE ${patron}
    ) t
    ORDER BY nombre
    LIMIT 20`;
}

export function inscritos() {
  return sql()`
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
    ORDER BY nivel, grado, colegio, nombre`;
}

export async function nivelDe(tipo, id) {
  const [al] = tipo === 'DELEGACION'
    ? await sql()`SELECT nivel FROM alumnos WHERE id = ${id}`
    : await sql()`SELECT nivel FROM libres WHERE id = ${id}`;
  return al ? al.nivel : null;
}

export function nivelesDeTodos() {
  return sql()`
    SELECT 'DELEGACION' AS tipo, id, nivel FROM alumnos
    UNION ALL
    SELECT 'LIBRE', id, nivel FROM libres`;
}

/** Todos los inscritos con datos para asignar puntajes por DNI al importar. */
export function todosParaImportar() {
  return sql()`
    SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado, f.ie AS colegio
    FROM alumnos a JOIN fichas f ON f.id = a.ficha_id
    UNION ALL
    SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado, 'Alumno libre' FROM libres l`;
}

export function paresNivelGrado() {
  return sql()`
    SELECT DISTINCT nivel, grado FROM (
      SELECT nivel, grado FROM alumnos
      UNION ALL
      SELECT nivel, grado FROM libres
    ) t`;
}

export async function mediosUsados() {
  return (await sql()`SELECT DISTINCT medio FROM libres WHERE medio <> '' ORDER BY medio`).map(m => m.medio);
}

export function colegios(patron) {
  return sql()`
    SELECT f.id, f.ie, COUNT(a.id)::int AS alumnos
    FROM fichas f
    LEFT JOIN alumnos a ON a.ficha_id = f.id
    WHERE unaccent(f.ie) ILIKE unaccent(${patron})
    GROUP BY f.id, f.ie
    ORDER BY f.ie
    LIMIT 1000`;
}

export async function colegioPorId(fichaId) {
  const [f] = await sql()`SELECT ie FROM fichas WHERE id = ${fichaId}`;
  return f || null;
}

export async function buscarPorDni(dni) {
  const dup = await sql()`
    SELECT nombre FROM alumnos WHERE dni = ${dni}
    UNION ALL
    SELECT nombre FROM libres WHERE dni = ${dni}
    LIMIT 1`;
  return dup.length ? dup[0] : null;
}

/** Una sola instrucción: agrega al alumno, registra su pago y suma el monto a la ficha (todo o nada). */
export async function agregarAlumnoADelegacion({ ficha_id, nivel, grado, dni, nombre, monto, medio, operacion }) {
  const [n] = await sql()`
    WITH nuevo AS (
      INSERT INTO alumnos (ficha_id, nivel, grado, nro, dni, nombre)
      SELECT ${ficha_id}::int, ${nivel}::text, ${grado}::text,
             COALESCE(MAX(nro), 0) + 1, ${dni}::text, ${nombre}::text
      FROM alumnos WHERE ficha_id = ${ficha_id}::int
      RETURNING id, nro
    ), pago AS (
      INSERT INTO pagos_adicionales (ficha_id, alumno_id, monto, medio, operacion)
      SELECT ${ficha_id}::int, nuevo.id, ${monto}::int, ${medio}::text, ${operacion}::text FROM nuevo
      RETURNING id
    ), ficha AS (
      UPDATE fichas SET monto = monto + ${monto}::int WHERE id = ${ficha_id}::int
      RETURNING monto
    )
    SELECT nuevo.id, nuevo.nro, (SELECT monto FROM ficha) AS monto_ficha FROM nuevo`;
  return n;
}

export async function agregarLibre({ dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, telefono }) {
  const [n] = await sql()`
    INSERT INTO libres (dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, created_at, telefono)
    VALUES (${dni}::text, ${grado}::text, ${nivel}::text, ${nombre}::text, ${monto}::int,
            ${operacion}::text, ${medio}::text, ${pagador}::text, ${verificado}::boolean, now(), ${telefono}::text)
    RETURNING id`;
  return n;
}
