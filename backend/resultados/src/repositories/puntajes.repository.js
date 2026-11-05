/**
 * Escritura de puntajes en la tabla resultados.
 * `upsert` y `upsertMasivo` solo arman la consulta ({ text, values }); se ejecutan con
 * `ejecutar` (una) o `transaccion` (varias, todo o nada).
 */
import { poolAdmin, filas, transaccion as transaccionEn } from '../config/db.js';

export function upsert(tipo, id, pts, h) {
  const col = tipo === 'DELEGACION' ? 'alumno_id' : 'libre_id';
  return {
    text: `INSERT INTO resultados (${col}, puntaje, hora_entrega) VALUES ($1, $2, $3)
           ON CONFLICT (${col}) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`,
    values: [id, pts, h],
  };
}

/** Inserta o reemplaza muchos puntajes a la vez; `paquete` es un JSON [{ id, p, h }]. */
export function upsertMasivo(tipo, paquete) {
  const col = tipo === 'DELEGACION' ? 'alumno_id' : 'libre_id';
  return {
    text: `INSERT INTO resultados (${col}, puntaje, hora_entrega)
           SELECT (x->>'id')::int, (x->>'p')::numeric, (x->>'h')::time FROM jsonb_array_elements($1::jsonb) AS x
           ON CONFLICT (${col}) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`,
    values: [paquete],
  };
}

export const ejecutar = consulta => filas(poolAdmin(), consulta);

export function borrar(tipo, id) {
  const col = tipo === 'DELEGACION' ? 'alumno_id' : 'libre_id';
  return ejecutar({ text: `DELETE FROM resultados WHERE ${col} = $1`, values: [id] });
}

export function previos() {
  return ejecutar({ text: `
    SELECT 'DELEGACION' AS tipo, alumno_id AS id, puntaje, hora_entrega FROM resultados WHERE alumno_id IS NOT NULL
    UNION ALL
    SELECT 'LIBRE', libre_id, puntaje, hora_entrega FROM resultados WHERE libre_id IS NOT NULL` });
}

export const transaccion = consultas => transaccionEn(poolAdmin(), consultas);
