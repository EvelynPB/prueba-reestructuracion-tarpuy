-- =====================================================================
-- 02 · Sistema de Resultados: tablas, vistas y ajustes
-- Requiere: 01_inscripciones.sql (tablas fichas, alumnos y libres).
-- Se puede ejecutar varias veces: no borra datos.
-- Lo ejecuta el dueño de la base (no los roles de la aplicación).
-- =====================================================================

-- Búsqueda de nombres sin importar tildes
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------- Puntajes: uno por alumno de delegación o por alumno libre ----------
CREATE TABLE IF NOT EXISTS resultados (
  id           SERIAL PRIMARY KEY,
  alumno_id    INTEGER UNIQUE REFERENCES alumnos(id) ON DELETE CASCADE,
  libre_id     INTEGER UNIQUE REFERENCES libres(id)  ON DELETE CASCADE,
  puntaje      NUMERIC(6,2) NOT NULL,
  hora_entrega TIME NOT NULL,   -- admite HH:MM:SS; desempata el orden de mérito
  CHECK ((alumno_id IS NOT NULL)::int + (libre_id IS NOT NULL)::int = 1)
);

-- ---------- Interruptor de publicación (RN-07): una sola fila ----------
CREATE TABLE IF NOT EXISTS config_resultados (
  id        INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  publicado BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO config_resultados (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------- Pagos de alumnos agregados a una delegación desde el panel ----------
-- [Reconstruida] El código la usa (POST /api/admin/alumno) pero no estaba en el repositorio.
CREATE TABLE IF NOT EXISTS pagos_adicionales (
  id         SERIAL PRIMARY KEY,
  ficha_id   INTEGER NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  alumno_id  INTEGER REFERENCES alumnos(id) ON DELETE SET NULL,
  monto      INTEGER NOT NULL CHECK (monto >= 0),
  medio      TEXT NOT NULL,
  operacion  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pagos_adicionales_ficha ON pagos_adicionales(ficha_id);
CREATE INDEX IF NOT EXISTS idx_resultados_alumno ON resultados(alumno_id);
CREATE INDEX IF NOT EXISTS idx_resultados_libre  ON resultados(libre_id);

-- ---------- Medios de pago que acepta el panel ----------
-- El formulario público solo admite Yape y Transferencia, pero el panel de resultados
-- también registra alumnos libres pagados con Plin o en efectivo.
ALTER TABLE libres DROP CONSTRAINT IF EXISTS libres_medio_check;
ALTER TABLE libres ADD CONSTRAINT libres_medio_check
  CHECK (medio IN ('Yape', 'Plin', 'Transferencia', 'Efectivo'));

-- ---------- Vista pública de resultados (solo campos seguros: sin DNI ni contactos) ----------
-- Incluye a TODOS los inscritos. Quien no tiene puntaje figura como «No rindió»:
-- rindio = false, puntaje 0 y sin mérito.
--   maximo        200 en Inicial, 150 en Primaria y Secundaria
--   porcentaje    puntaje / maximo × 100
--   merito        puesto en su nivel y grado (puntaje mayor; empate → hora de entrega más temprana)
--   merito_general puesto entre todos según el porcentaje del máximo
-- Solo devuelve filas cuando los resultados están publicados.
-- [Reconstruida] Las columnas rindio, maximo y porcentaje las usaba el código, pero no estaban en el script.
CREATE OR REPLACE VIEW vista_resultados AS
WITH inscritos AS (
  SELECT 'DELEGACION'::text AS tipo, a.nombre, f.ie AS colegio,
         a.nivel, a.grado, r.puntaje, r.hora_entrega
  FROM alumnos a
  JOIN fichas f ON f.id = a.ficha_id
  LEFT JOIN resultados r ON r.alumno_id = a.id
  UNION ALL
  SELECT 'LIBRE'::text, l.nombre, 'Alumno libre'::text,
         l.nivel, l.grado, r.puntaje, r.hora_entrega
  FROM libres l
  LEFT JOIN resultados r ON r.libre_id = l.id
), base AS (
  SELECT tipo, nombre, colegio, nivel, grado,
         COALESCE(puntaje, 0)::numeric(6,2) AS puntaje,
         hora_entrega,
         puntaje IS NOT NULL AS rindio,
         CASE WHEN lower(unaccent(nivel)) LIKE '%inicial%' THEN 200 ELSE 150 END AS maximo
  FROM inscritos
)
SELECT tipo, nombre, colegio, nivel, grado, puntaje, hora_entrega,
  CASE WHEN rindio THEN RANK() OVER (PARTITION BY nivel, grado, rindio
                                     ORDER BY puntaje DESC, hora_entrega ASC) END AS merito,
  CASE WHEN rindio THEN RANK() OVER (PARTITION BY rindio
                                     ORDER BY puntaje * 100.0 / maximo DESC, hora_entrega ASC) END AS merito_general,
  rindio,
  maximo,
  ROUND(puntaje * 100.0 / maximo, 2) AS porcentaje
FROM base
WHERE (SELECT publicado FROM config_resultados WHERE id = 1);

-- ---------- Ranking de delegaciones ----------
-- Por cada colegio y nivel: promedio del porcentaje del máximo entre TODOS sus alumnos
-- inscritos en ese nivel (quien no rindió cuenta como 0). Si nadie del nivel rindió, el nivel
-- queda en NULL (la página muestra «—») y suma 0 al acumulado. promedio = acumulado ÷ 3.
-- No incluye alumnos libres. Solo devuelve filas cuando los resultados están publicados.
-- [Reconstruida] El código la usa (GET /api/ranking-colegios) pero no estaba en el repositorio.
CREATE OR REPLACE VIEW vista_ranking_colegios AS
WITH al AS (
  SELECT f.id AS ficha_id, f.ie AS colegio,
         CASE WHEN lower(unaccent(a.nivel)) LIKE '%inicial%'  THEN 'I'
              WHEN lower(unaccent(a.nivel)) LIKE '%primaria%' THEN 'P'
              ELSE 'S' END AS niv,
         CASE WHEN lower(unaccent(a.nivel)) LIKE '%inicial%' THEN 200 ELSE 150 END AS maximo,
         r.puntaje
  FROM fichas f
  JOIN alumnos a ON a.ficha_id = f.id
  LEFT JOIN resultados r ON r.alumno_id = a.id
), por_nivel AS (
  SELECT ficha_id, colegio,
    CASE WHEN COUNT(puntaje) FILTER (WHERE niv = 'I') > 0
         THEN AVG(COALESCE(puntaje, 0) * 100.0 / maximo) FILTER (WHERE niv = 'I') END AS inicial,
    CASE WHEN COUNT(puntaje) FILTER (WHERE niv = 'P') > 0
         THEN AVG(COALESCE(puntaje, 0) * 100.0 / maximo) FILTER (WHERE niv = 'P') END AS primaria,
    CASE WHEN COUNT(puntaje) FILTER (WHERE niv = 'S') > 0
         THEN AVG(COALESCE(puntaje, 0) * 100.0 / maximo) FILTER (WHERE niv = 'S') END AS secundaria,
    CASE WHEN COUNT(puntaje) FILTER (WHERE niv = 'I') > 0
         THEN AVG(COALESCE(puntaje, 0)) FILTER (WHERE niv = 'I') END AS inicial_pts,
    CASE WHEN COUNT(puntaje) FILTER (WHERE niv = 'P') > 0
         THEN AVG(COALESCE(puntaje, 0)) FILTER (WHERE niv = 'P') END AS primaria_pts,
    CASE WHEN COUNT(puntaje) FILTER (WHERE niv = 'S') > 0
         THEN AVG(COALESCE(puntaje, 0)) FILTER (WHERE niv = 'S') END AS secundaria_pts,
    COUNT(puntaje) AS rindieron,
    COUNT(*)       AS inscritos
  FROM al
  GROUP BY ficha_id, colegio
), total AS (
  SELECT *, COALESCE(inicial, 0) + COALESCE(primaria, 0) + COALESCE(secundaria, 0) AS acumulado
  FROM por_nivel
)
SELECT RANK() OVER (ORDER BY acumulado DESC) AS puesto,
       colegio,
       ROUND(inicial, 2)        AS inicial,
       ROUND(primaria, 2)       AS primaria,
       ROUND(secundaria, 2)     AS secundaria,
       ROUND(inicial_pts, 2)    AS inicial_pts,
       ROUND(primaria_pts, 2)   AS primaria_pts,
       ROUND(secundaria_pts, 2) AS secundaria_pts,
       ROUND(acumulado, 2)      AS acumulado,
       ROUND(acumulado / 3, 2)  AS promedio,
       rindieron,
       inscritos
FROM total
WHERE (SELECT publicado FROM config_resultados WHERE id = 1);
