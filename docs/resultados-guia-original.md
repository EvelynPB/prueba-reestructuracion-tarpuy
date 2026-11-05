> **Nota:** guía original del sistema, conservada como referencia. Las rutas de archivos y los comandos de despliegue cambiaron con la reestructuración: consulta el [README](../README.md) y [despliegue.md](despliegue.md).

# Resultados del concurso

Página pública de resultados y panel de carga de puntajes. Servidor Node (Express) con páginas HTML, conectado a Neon (PostgreSQL) y listo para Fly.io.

- `/resultados`: página pública con buscador, filtros (colegio, nivel, grado, tipo), mérito automático y actualización cada 20 s.
- `/admin`: carga de puntaje y hora de entrega (con segundos) y botón para publicar u ocultar los resultados.

## Seguridad
- La página pública usa el rol `resultados_lector`, que solo lee `vista_resultados`.
- El panel usa el rol `resultados_admin`, que solo ve las columnas necesarias para encontrar al alumno.
- Nunca subas el archivo `.env` ni claves reales a GitHub (el `.gitignore` ya lo excluye).
- Antes de subir la carpeta `sql/`, deja las claves de ejemplo tal cual: cambia las reales directamente en Neon.

## 1. Base de datos (Neon → SQL Editor)
1. Ejecuta `sql/01_resultados.sql`.
2. Ejecuta `sql/02_admin.sql`.
   (Cambia `PON_UNA_CLAVE_FUERTE` y `PON_OTRA_CLAVE_FUERTE_DISTINTA` por claves reales al ejecutarlos.)

## 2. Probar en tu computadora
    cp .env.example .env      # y llena las 3 variables
    npm install
    node --env-file=.env server.js
Abre http://localhost:3000/admin y http://localhost:3000/resultados

## 3. Subir a GitHub
    git init
    git add .
    git commit -m "Resultados del concurso"
    git branch -M main
    git remote add origin https://github.com/TU_USUARIO/concurso-resultados.git
    git push -u origin main

## 4. Desplegar en Fly.io
1. Instala `flyctl` e inicia sesión: `fly auth login`
2. Edita `fly.toml` y cambia `app` por un nombre único.
3. Crea la app sin desplegar: `fly launch --no-deploy --copy-config`
4. Guarda las claves como secretos (no van en el código):

       fly secrets set DATABASE_URL_LECTOR="postgresql://..." DATABASE_URL_ADMIN="postgresql://..." ADMIN_PASSWORD="una-clave-larga"
5. Despliega: `fly deploy`
6. Tu web queda en `https://TU-APP.fly.dev/resultados`

### Despliegue automático desde GitHub (opcional)
1. Crea un token: `fly tokens create deploy`
2. En GitHub: Settings → Secrets and variables → Actions → New repository secret, con nombre `FLY_API_TOKEN` y ese token.
3. Cada `git push` a `main` desplegará solo (`.github/workflows/fly-deploy.yml`).

## Cargar puntajes
Entra a `/admin`, busca al alumno, escribe puntaje y hora de entrega, y guarda. Cuando todo esté revisado, pulsa **Publicar resultados**.
