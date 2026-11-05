/**
 * Escritura de puntajes en la tabla resultados.
 * Las funciones que devuelven la consulta sin `await` se usan dentro de sql.transaction([...]) (todo o nada).
 */
import { sqlAdmin } from '../config/db.js';

const sql = () => sqlAdmin();

export function upsert(tipo, id, pts, h) {
  return tipo === 'DELEGACION'
    ? sql()`INSERT INTO resultados (alumno_id, puntaje, hora_entrega)
              VALUES (${id}, ${pts}, ${h})
              ON CONFLICT (alumno_id) DO UPDATE
              SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`
    : sql()`INSERT INTO resultados (libre_id, puntaje, hora_entrega)
              VALUES (${id}, ${pts}, ${h})
              ON CONFLICT (libre_id) DO UPDATE
              SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`;
}

export function borrar(tipo, id) {
  return tipo === 'DELEGACION'
    ? sql()`DELETE FROM resultados WHERE alumno_id = ${id}`
    : sql()`DELETE FROM resultados WHERE libre_id = ${id}`;
}

export function previos() {
  return sql()`
    SELECT 'DELEGACION' AS tipo, alumno_id AS id, puntaje, hora_entrega FROM resultados WHERE alumno_id IS NOT NULL
    UNION ALL
    SELECT 'LIBRE', libre_id, puntaje, hora_entrega FROM resultados WHERE libre_id IS NOT NULL`;
}

/** Inserta o reemplaza muchos puntajes a la vez; `paquete` es un JSON [{ id, p, h }]. */
export function upsertMasivo(tipo, paquete) {
  return tipo === 'DELEGACION'
    ? sql()`INSERT INTO resultados (alumno_id, puntaje, hora_entrega)
        SELECT (x->>'id')::int, (x->>'p')::numeric, (x->>'h')::time FROM jsonb_array_elements(${paquete}::jsonb) AS x
        ON CONFLICT (alumno_id) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`
    : sql()`INSERT INTO resultados (libre_id, puntaje, hora_entrega)
        SELECT (x->>'id')::int, (x->>'p')::numeric, (x->>'h')::time FROM jsonb_array_elements(${paquete}::jsonb) AS x
        ON CONFLICT (libre_id) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`;
}

export const transaccion = consultas => sql().transaction(consultas);
