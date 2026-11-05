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
├── frontend/                     Capa de presentación (HTML, CSS y JavaScript del navegador)
│   ├── inscripciones/
│   │   ├── index.html            Formulario de inscripción y panel del organizador
│   │   ├── css/estilos.css
│   │   └── js/app.js
│   └── resultados/
│       ├── resultados.html       Consulta pública de resultados
│       ├── admin.html            Panel de carga de puntajes
│       ├── index.html            Página de inicio de ejemplo
│       ├── css/                  estilos.css (común) y admin.css
│       ├── js/                   resultados.js, admin.js y fondo.js (animación)
│       └── img/logo.png
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
│   └── scripts/                  01_inscripciones.sql · 02_resultados.sql · 03_resultados_roles.sql
│
├── docs/                         Arquitectura, API, base de datos, despliegue y observaciones
├── .dockerignore
├── .gitignore
└── README.md
```

Cada backend sirve su propio frontend: el de inscripciones publica `frontend/inscripciones` y el de resultados publica `frontend/resultados`. Por eso cada imagen Docker se construye desde la raíz del repositorio (ver [docs/despliegue.md](docs/despliegue.md)).

---

## Arquitectura

```text
Navegador (HTML + CSS + JS, Fetch API)
        │  HTTPS / JSON
        ▼
routes → middlewares → controllers → services → repositories
        (Node.js + Express)                          │ SQL
                                                     ▼
                                     PostgreSQL (Neon)
```

Detalle en [docs/arquitectura.md](docs/arquitectura.md).

---

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | HTML5, CSS3, JavaScript ES6+, Fetch API, Canvas API, Google Fonts |
| Backend | Node.js, Express.js, `express-rate-limit`, `exceljs` |
| Datos | PostgreSQL en Neon (`pg` en inscripciones, `@neondatabase/serverless` en resultados) |
| Despliegue | Docker, Fly.io |
| Trabajo colaborativo | Git, GitHub |

---

## Ejecución local

Requisitos: Node.js 20 o superior, npm y una base PostgreSQL (local o Neon).

### Sistema de Inscripciones

```bash
cd backend/inscripciones
npm install
```

Variables de entorno necesarias (en Windows PowerShell usa `$env:NOMBRE="valor"`):

```bash
export DATABASE_URL="postgresql://usuario:clave@host/base?sslmode=require"
export ADMIN_PASSWORD="clave-del-organizador"
export SESSION_SECRET="una-cadena-larga-y-aleatoria"
```

```bash
npm start
```

Abre http://localhost:8080. Las tablas se crean solas al arrancar (script `database/scripts/01_inscripciones.sql`).

### Sistema de Resultados

```bash
cd backend/resultados
npm install
```

```bash
export DATABASE_URL_LECTOR="postgresql://resultados_lector:...@host/base?sslmode=require"
export DATABASE_URL_ADMIN="postgresql://resultados_admin:...@host/base?sslmode=require"
export ADMIN_PASSWORD="clave-del-panel"
```

```bash
npm start
```

Abre http://localhost:3000/resultados y http://localhost:3000/admin. Este sistema usa el driver HTTP de Neon, así que necesita una base de datos en Neon (no funciona con un PostgreSQL local). Antes debes ejecutar los scripts `02` y `03` de `database/scripts` (ver [docs/base-de-datos.md](docs/base-de-datos.md)).

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
