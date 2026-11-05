-- Para buscar nombres sin importar tildes
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Usuario interno del panel de carga (lo usa el servidor, no una persona)
CREATE ROLE resultados_admin LOGIN PASSWORD 'PON_OTRA_CLAVE_FUERTE_DISTINTA';
GRANT USAGE ON SCHEMA public TO resultados_admin;

-- Solo las columnas necesarias para encontrar al alumno (sin correo, teléfono, pagos, etc.)
GRANT SELECT (id, nombre, dni, nivel, grado, ficha_id) ON alumnos TO resultados_admin;
GRANT SELECT (id, nombre, dni, nivel, grado)           ON libres  TO resultados_admin;
GRANT SELECT (id, ie)                                  ON fichas  TO resultados_admin;

-- Cargar, corregir y borrar resultados
GRANT SELECT, INSERT, UPDATE, DELETE ON resultados TO resultados_admin;
GRANT USAGE, SELECT ON SEQUENCE resultados_id_seq TO resultados_admin;

-- Publicar / ocultar
GRANT SELECT, UPDATE ON config_resultados TO resultados_admin;
