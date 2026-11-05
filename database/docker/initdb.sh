#!/usr/bin/env bash
# Lo ejecuta la imagen oficial de PostgreSQL la PRIMERA vez que crea el volumen de datos
# (carpeta /docker-entrypoint-initdb.d). Ver docker-compose.yml en la raíz del repositorio.
set -euo pipefail

export DATABASE_URL="postgresql:///${POSTGRES_DB}?user=${POSTGRES_USER}"
if [[ "${DATOS_PRUEBA:-no}" == "si" ]]; then
  /database/instalar.sh --datos-prueba
else
  /database/instalar.sh
fi
