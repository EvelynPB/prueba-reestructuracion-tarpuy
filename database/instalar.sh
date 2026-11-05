#!/usr/bin/env bash
# =====================================================================
# Crea o actualiza la base de datos del concurso en cualquier PostgreSQL (local, Neon u otro).
#
# Uso (desde la raíz del repositorio):
#   export DATABASE_URL="postgresql://dueño:clave@host:5432/base"   # usuario dueño de la base
#   export CLAVE_LECTOR="..."    # contraseña para el rol resultados_lector
#   export CLAVE_ADMIN="..."     # contraseña para el rol resultados_admin
#   ./database/instalar.sh                    # producción: esquema + roles
#   ./database/instalar.sh --datos-prueba     # desarrollo: además, datos ficticios
#
# Requiere el cliente psql. Todos los scripts se pueden volver a ejecutar sin perder datos.
# =====================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/scripts" && pwd)"
: "${DATABASE_URL:?Define DATABASE_URL con el usuario dueño de la base}"
: "${CLAVE_LECTOR:?Define CLAVE_LECTOR (contraseña del rol resultados_lector)}"
: "${CLAVE_ADMIN:?Define CLAVE_ADMIN (contraseña del rol resultados_admin)}"

ARGS=(-v ON_ERROR_STOP=1 -q -f "$DIR/01_inscripciones.sql" -f "$DIR/02_resultados.sql"
      -v clave_lector="$CLAVE_LECTOR" -v clave_admin="$CLAVE_ADMIN" -f "$DIR/03_roles.sql")
if [[ "${1:-}" == "--datos-prueba" ]]; then
  ARGS+=(-f "$DIR/04_datos_prueba.sql")
fi

psql "$DATABASE_URL" "${ARGS[@]}"
echo "Base de datos lista."
