-- 1) Tablas nuevas (alumnos, libres y fichas ya existen y no se tocan)
CREATE TABLE resultados (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER UNIQUE REFERENCES alumnos(id) ON DELETE CASCADE,
  libre_id  INTEGER UNIQUE REFERENCES libres(id)  ON DELETE CASCADE,
  puntaje NUMERIC(6,2) NOT NULL,
  hora_entrega TIME NOT NULL,   -- admite HH:MM:SS
  CHECK ((alumno_id IS NOT NULL)::int + (libre_id IS NOT NULL)::int = 1)
);

CREATE TABLE config_resultados (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  publicado BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO config_resultados DEFAULT VALUES;

-- 2) Vista con el mérito automático (solo campos seguros)
CREATE VIEW vista_resultados AS
WITH base AS (
  SELECT 'DELEGACION'::text AS tipo, a.nombre, f.ie AS colegio,
         a.nivel, a.grado, r.puntaje, r.hora_entrega
  FROM resultados r
  JOIN alumnos a ON a.id = r.alumno_id
  JOIN fichas  f ON f.id = a.ficha_id
  UNION ALL
  SELECT 'LIBRE'::text, l.nombre, 'Alumno libre'::text,
         l.nivel, l.grado, r.puntaje, r.hora_entrega
  FROM resultados r
  JOIN libres l ON l.id = r.libre_id
)
SELECT tipo, nombre, colegio, nivel, grado, puntaje, hora_entrega,
  RANK() OVER (PARTITION BY nivel, grado
               ORDER BY puntaje DESC, hora_entrega ASC) AS merito,
  RANK() OVER (ORDER BY puntaje DESC, hora_entrega ASC) AS merito_general
FROM base
WHERE (SELECT publicado FROM config_resultados WHERE id = 1);

-- 3) Usuario de solo lectura para la página pública
CREATE ROLE resultados_lector LOGIN PASSWORD 'PON_UNA_CLAVE_FUERTE';
GRANT USAGE ON SCHEMA public TO resultados_lector;
GRANT SELECT ON vista_resultados TO resultados_lector;
GRANT SELECT (publicado) ON config_resultados TO resultados_lector;
