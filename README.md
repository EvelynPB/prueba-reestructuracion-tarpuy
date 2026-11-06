# Plataforma Web para la Gestión de Inscripciones y Publicación de Resultados

Proyecto final del curso **Fullstack Developer Software** de la carrera de **Ingeniería de Software con Inteligencia Artificial – SENATI**.

La plataforma apoya la gestión del **XI Concurso Nacional de Matemática Lima Este 2026 – Olimpiada Tarpuyana**, organizado por la IEP Colegio Tarpuy Moderno. Digitaliza dos procesos:

1. **Sistema de Inscripciones**: registro de delegaciones (I.E. con asesores y hasta 10 alumnos por grado) y de alumnos libres, con cálculo automático del monto, panel del organizador, verificación de pagos y exportación a Excel.
2. **Sistema de Resultados**: registro de puntajes (individual, en lote o importando un archivo), inscripciones de último momento, cálculo del orden de mérito, ranking por instituciones y publicación controlada.

| Sistema | Producción |
|---|---|
| Inscripciones | https://concurso-tarpuy-2026.fly.dev |
| Resultados (público) | https://resultados-concursomat2026.fly.dev/resultados |
| Resultados (panel) | https://resultados-concursomat2026.fly.dev/admin |

---

## Estructura del repositorio

```text
.
├── frontend/                     Capa de presentación: React 19 + Tailwind CSS 4 (con Vite)
│   ├── inscripciones/
│   │   ├── index.html            Página única: formulario de inscripción y panel del organizador
│   │   ├── public/img/           Logo y QR de Yape
│   │   └── src/
│   │       ├── App.jsx           Modalidad (delegación o alumno libre) y panel del organizador
│   │       ├── components/       comunes/ · delegacion/ · libre/ · organizador/
│   │       ├── config/           Datos del concurso: grados, precios, Yape y cuenta bancaria
│   │       ├── services/api.js   Llamadas a la API REST
│   │       └── utils/            Validaciones (DNI, teléfono, N.° de operación)
│   └── resultados/
│       ├── resultados.html       Consulta pública de resultados
│       ├── admin.html            Panel de carga de puntajes
│       ├── index.html            Página de inicio de ejemplo
│       └── src/
│           ├── publico/          Página pública: pestañas, filtros, tablas y ranking
│           ├── admin/            Panel: búsqueda, ficha, carga por grado, importación, último momento
│           ├── components/       Cabecera y fondo animado
│           ├── services/         Llamadas a la API (pública y del panel)
│           └── utils/            Normalización de texto, orden natural, puntaje máximo
│
├── backend/                      API REST en Node.js + Express (una aplicación por sistema)
│   ├── inscripciones/
│   │   ├── server.js             Punto de entrada
│   │   ├── src/
│   │   │   ├── config/           Variables de entorno, conexión a la BD, catálogo de grados, rutas
│   │   │   ├── routes/           Definición de endpoints
│   │   │   ├── controllers/      Reciben la petición y devuelven la respuesta HTTP
│   │   │   ├── services/         Reglas de negocio (RN-01 a RN-06) y exportación a Excel
│   │   │   ├── repositories/     Consultas SQL
│   │   │   ├── middlewares/      Sesión, cabeceras de seguridad, rate limiting, errores
│   │   │   └── utils/
│   │   ├── package.json · Dockerfile · fly.toml
│   └── resultados/
│       ├── server.js
│       ├── src/                  Mismas capas que inscripciones
│       └── package.json · Dockerfile · fly.toml
│
├── database/
│   ├── scripts/                  01_inscripciones · 02_resultados · 03_roles · 04_datos_prueba (.sql)
│   ├── instalar.sh               Crea o actualiza la base en cualquier PostgreSQL
│   └── docker/initdb.sh          Lo usa docker-compose la primera vez
│
├── docs/                         Arquitectura, API, base de datos, despliegue y observaciones
├── docker-compose.yml            PostgreSQL local para desarrollo
├── .dockerignore
├── .gitignore
└── README.md
```

Cada frontend se compila con `npm run build` en una carpeta `dist/`, y su backend la sirve: el de inscripciones publica `frontend/inscripciones/dist` y el de resultados publica `frontend/resultados/dist`. Por eso cada imagen Docker se construye desde la raíz del repositorio y compila primero el frontend (ver [docs/despliegue.md](docs/despliegue.md)).

---

## Arquitectura

```text
Navegador (React + Tailwind CSS, Fetch API)
        │  HTTPS / JSON
        ▼
routes → middlewares → controllers → services → repositories
        (Node.js + Express)                          │ SQL
                                                     ▼
                         PostgreSQL (local, Neon u otro)
```

Detalle en [docs/arquitectura.md](docs/arquitectura.md).

---

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Tailwind CSS 4, Vite 8, JavaScript ES6+, Fetch API, Canvas API, Google Fonts |
| Backend | Node.js, Express.js, `express-rate-limit`, `exceljs` |
| Datos | PostgreSQL 16 con el driver `pg`, scripts SQL versionados y roles de permisos mínimos |
| Despliegue | Docker, Fly.io |
| Trabajo colaborativo | Git, GitHub |

---

## Ejecución local

Requisitos: Node.js 20.19 o superior (recomendado 22) y PostgreSQL 16 (con Docker o instalado en tu computadora).

### 1. Base de datos

**Opción A, con Docker** (recomendada): crea la base `concurso` con las tablas, los roles y datos de prueba ficticios.

```bash
docker compose up -d
```

**Opción B, con un PostgreSQL ya instalado** (requiere el cliente `psql`). Primero crea una base vacía, por ejemplo `concurso`, y luego:

```bash
export DATABASE_URL="postgresql://postgres:TU_CLAVE@localhost:5432/concurso"
export CLAVE_LECTOR="lector_local"
export CLAVE_ADMIN="admin_local"
./database/instalar.sh --datos-prueba
```

En Windows, ejecuta `instalar.sh` desde Git Bash. Más detalles en [docs/base-de-datos.md](docs/base-de-datos.md).

### 2. Backends

En una terminal para cada sistema:

```bash
cd backend/inscripciones
cp .env.example .env
npm install
npm run dev
```

```bash
cd backend/resultados
cp .env.example .env
npm install
npm run dev
```

Ajusta `DATABASE_URL` en cada `.env` si no usas los valores de `docker-compose.yml`. El backend de resultados se conecta con dos roles de permisos mínimos: `resultados_lector` para la página pública y `resultados_admin` para el panel.

### 3. Frontends (React + Tailwind)

**Para programar**, con recarga automática al guardar los cambios:

```bash
cd frontend/inscripciones
npm install
npm run dev
```

```bash
cd frontend/resultados
npm install
npm run dev
```

| Página | Dirección en desarrollo |
|---|---|
| Inscripciones | http://localhost:5173 |
| Resultados (público) | http://localhost:5174/resultados |
| Resultados (panel) | http://localhost:5174/admin (clave: `ADMIN_PASSWORD` del `.env`) |

Vite reenvía las peticiones `/api` al backend correspondiente (puertos 8080 y 3000), así que los backends deben estar encendidos.

**Para probar como en producción:** ejecuta `npm run build` en cada carpeta de `frontend/` y abre los backends directamente: http://localhost:8080, http://localhost:3000/resultados y http://localhost:3000/admin.

---

## Documentación

- [Arquitectura y organización por capas](docs/arquitectura.md)
- [Endpoints de la API REST](docs/api.md)
- [Base de datos](docs/base-de-datos.md)
- [Despliegue en Fly.io](docs/despliegue.md)
- [Observaciones: diferencias entre el informe y el código](docs/observaciones-informe.md)
- Guías originales de cada sistema: [inscripciones](docs/inscripciones-guia-original.md) · [resultados](docs/resultados-guia-original.md)

---

## Flujo de trabajo con Git

- `main`: código estable desplegado en producción.
- `develop`: integración de las funcionalidades del sprint.
- `feature/<nombre>`: una rama por funcionalidad, integrada mediante pull request revisado por al menos un integrante.

---

## Integrantes

- Dávila Arenas, Hugo Javier
- Incio Ccahuana, Anthony
- Peralta Barboza, Evelyn Angely
- Rimachi Taipe, Martín Alejandro
- Román Espinoza, Diógenes
- Torpoco Torres, Francisco

**Docente:** Aldo Omar Morales Carlos · SENATI · Lima, 2026
