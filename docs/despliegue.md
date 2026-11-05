# Despliegue en Fly.io

Cada sistema es una aplicación distinta en Fly.io. Como cada backend sirve archivos de `frontend/` (y el de inscripciones también lee `database/scripts/`), **la imagen Docker se construye desde la raíz del repositorio**, no desde la carpeta del backend.

## Comandos (se ejecutan desde la raíz del repositorio)

Sistema de Inscripciones:

```bash
fly deploy . --config backend/inscripciones/fly.toml --dockerfile backend/inscripciones/Dockerfile
```

Sistema de Resultados:

```bash
fly deploy . --config backend/resultados/fly.toml --dockerfile backend/resultados/Dockerfile
```

El `.` indica que el contexto de construcción es la raíz. Cada Dockerfile tiene **dos etapas**: la primera instala las dependencias del frontend y ejecuta `npm run build` (React + Tailwind); la segunda instala solo las dependencias de producción del backend y copia la carpeta `dist/` ya compilada. La imagen final no lleva Vite, React en modo desarrollo ni el código fuente del frontend. El archivo `.dockerignore` excluye `.git`, `node_modules`, `dist`, `.env` y `docs/`. Las imágenes usan Node.js 22 porque Vite 8 necesita Node.js 20.19 o superior.

## Base de datos

Antes del primer despliegue, y cada vez que cambien los scripts SQL, ejecuta desde tu computadora con el usuario dueño de la base:

```bash
DATABASE_URL="postgresql://dueño:...@host/base?sslmode=require" CLAVE_LECTOR="..." CLAVE_ADMIN="..." ./database/instalar.sh
```

Es seguro repetirlo, porque no borra datos. En producción, primero revisa la sección «Objetos reconstruidos» de [base-de-datos.md](base-de-datos.md).

## Secretos

`DATABASE_URL_LECTOR` y `DATABASE_URL_ADMIN` usan los roles `resultados_lector` y `resultados_admin` con las contraseñas que pasaste en `CLAVE_LECTOR` y `CLAVE_ADMIN`.

Inscripciones:

```bash
fly secrets set --config backend/inscripciones/fly.toml DATABASE_URL="..." ADMIN_PASSWORD="..." SESSION_SECRET="..."
```

Resultados:

```bash
fly secrets set --config backend/resultados/fly.toml DATABASE_URL_LECTOR="..." DATABASE_URL_ADMIN="..." ADMIN_PASSWORD="..."
```

Los precios (`PRECIO_DELEGACION`, `PRECIO_LIBRE`) están en la sección `[env]` de `backend/inscripciones/fly.toml`.

## Verificación

```bash
fly status --config backend/inscripciones/fly.toml
```

```bash
fly logs --config backend/inscripciones/fly.toml
```

Comprobaciones de salud: `GET /healthz` (inscripciones) y `GET /health` (resultados).

## Diferencia con la versión anterior

Antes se desplegaba entrando en `concurso-tarpuy-main/` o `Resultados-ConcursoMat2026-main/` y ejecutando `fly deploy`. Ese comando ya no sirve, porque el Dockerfile necesita las carpetas `frontend/` y `database/` de la raíz.

> Estos comandos no se probaron contra Fly.io durante la reestructuración. Antes de usarlos en producción, haz un despliegue de prueba (por ejemplo, en una app temporal) o compila la imagen localmente: `docker build -f backend/inscripciones/Dockerfile .`
