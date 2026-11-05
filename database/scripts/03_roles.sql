-- =====================================================================
-- 03 · Roles de la aplicación y permisos (principio de mínimo privilegio)
-- Requiere: 01_inscripciones.sql y 02_resultados.sql.
-- Se ejecuta con psql, pasando las contraseñas como variables (nunca escritas en el archivo):
--
--   psql "$DATABASE_URL" -v clave_lector='...' -v clave_admin='...' -f database/scripts/03_roles.sql
--
-- Se puede ejecutar varias veces: crea los roles si no existen y actualiza sus contraseñas.
-- =====================================================================

\if :{?clave_lector}
\else
  \echo 'Falta la variable clave_lector:  psql ... -v clave_lector=CLAVE -v clave_admin=CLAVE'
  \quit
\endif
\if :{?clave_admin}
\else
  \echo 'Falta la variable clave_admin:  psql ... -v clave_lector=CLAVE -v clave_admin=CLAVE'
  \quit
\endif

-- ---------- Crear los roles (si no existen) y fijar su contraseña ----------
SELECT format('CREATE ROLE resultados_lector LOGIN PASSWORD %L', :'clave_lector')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'resultados_lector') \gexec
SELECT format('CREATE ROLE resultados_admin LOGIN PASSWORD %L', :'clave_admin')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'resultados_admin') \gexec
ALTER ROLE resultados_lector WITH LOGIN PASSWORD :'clave_lector';
ALTER ROLE resultados_admin  WITH LOGIN PASSWORD :'clave_admin';

-- ---------- resultados_lector: la página pública /resultados ----------
-- Solo lee las vistas (que ya ocultan DNI y contactos y se vacían si no hay publicación).
GRANT USAGE ON SCHEMA public TO resultados_lector;
GRANT SELECT ON vista_resultados, vista_ranking_colegios TO resultados_lector;
-- Se necesita también la columna id porque el servidor consulta «WHERE id = 1».
GRANT SELECT (id, publicado) ON config_resultados TO resultados_lector;

-- ---------- resultados_admin: el panel /admin ----------
GRANT USAGE ON SCHEMA public TO resultados_admin;

-- Encontrar alumnos (sin correo, teléfonos ni datos de pago de la ficha)
GRANT SELECT (id, nombre, dni, nivel, grado, ficha_id, nro) ON alumnos TO resultados_admin;
GRANT SELECT (id, nombre, dni, nivel, grado, medio)         ON libres  TO resultados_admin;
GRANT SELECT (id, ie, monto)                                ON fichas  TO resultados_admin;

-- Cargar, corregir y borrar puntajes
GRANT SELECT, INSERT, UPDATE, DELETE ON resultados TO resultados_admin;
GRANT USAGE, SELECT ON SEQUENCE resultados_id_seq TO resultados_admin;

-- Publicar / ocultar
GRANT SELECT, UPDATE ON config_resultados TO resultados_admin;

-- Inscripciones de último momento (POST /api/admin/alumno y /api/admin/libre)
GRANT INSERT (ficha_id, nivel, grado, nro, dni, nombre) ON alumnos TO resultados_admin;
GRANT USAGE ON SEQUENCE alumnos_id_seq TO resultados_admin;
GRANT INSERT (dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, created_at, telefono)
  ON libres TO resultados_admin;
GRANT USAGE ON SEQUENCE libres_id_seq TO resultados_admin;
GRANT UPDATE (monto) ON fichas TO resultados_admin;
GRANT SELECT, INSERT ON pagos_adicionales TO resultados_admin;
GRANT USAGE ON SEQUENCE pagos_adicionales_id_seq TO resultados_admin;
