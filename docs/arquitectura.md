# Arquitectura

La plataforma sigue una arquitectura **cliente-servidor de tres capas** (presentación, lógica de negocio y datos), con dos aplicaciones independientes que comparten la misma base de datos PostgreSQL (local, Neon u otro proveedor).

```text
┌──────────────────────────┐        ┌──────────────────────────┐
│ frontend/inscripciones   │        │ frontend/resultados      │
│ React + Tailwind         │        │ React + Tailwind         │
└────────────┬─────────────┘        └────────────┬─────────────┘
             │ HTTPS / JSON                       │ HTTPS / JSON
┌────────────▼─────────────┐        ┌────────────▼─────────────┐
│ backend/inscripciones    │        │ backend/resultados       │
│ Express · CommonJS · pg  │        │ Express · ESM · pg       │
└────────────┬─────────────┘        └────────────┬─────────────┘
             │ SQL                                │ SQL (2 roles)
             └──────────────┬─────────────────────┘
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   └─────────────────┘
```

## Por qué dos backends separados

Los dos sistemas se desarrollaron y se despliegan por separado, y técnicamente son distintos:

| | Inscripciones | Resultados |
|---|---|---|
| Módulos | CommonJS (`require`) | ES Modules (`import`) |
| Conexión a la BD | `pg`, un pool con el dueño de las tablas | `pg`, dos pools con roles de permisos mínimos (`resultados_lector` y `resultados_admin`) |
| Autenticación | Cookie de sesión firmada (HMAC) | Clave en la cabecera `x-admin-key` |
| Puerto | 8080 | 3000 |
| App en Fly.io | `concurso-tarpuy-2026` | `concurso-resultados-tarpuy` |

Unirlos en un único backend obligaría a reescribir la lógica, no solo a reorganizarla. La reestructuración mantiene un backend por sistema y aplica en cada uno la **misma organización por capas** (RNF-08 del informe).

## Capas de cada backend

```text
petición HTTP
   │
   ▼
routes/         Define el endpoint (método + URL) y qué middlewares y controlador usa.
middlewares/    Seguridad transversal: sesión/clave, rate limiting, cabeceras, errores.
controllers/    Lee la petición, llama al servicio y arma la respuesta HTTP (código + JSON).
services/       Reglas de negocio: validaciones, cálculo del monto, límites, importación.
repositories/   Consultas SQL parametrizadas. Es la única capa que habla con la base.
config/         Variables de entorno, conexión, catálogos fijos y rutas a carpetas.
utils/          Funciones puras reutilizables (errores HTTP, normalización).
```

Regla de dependencia: cada capa solo llama a la de abajo (`routes → controllers → services → repositories`). Así se puede cambiar la interfaz sin tocar las reglas, o cambiar una consulta sin tocar los controladores.

> En el backend de resultados, varias validaciones de entrada siguen en los controladores, tal como estaban en el código original. Llevarlas a `services/` es una mejora posible, pero no se hizo para no cambiar el comportamiento durante la reestructuración.

## Ejemplo: recorrido de `POST /api/libres`

1. `routes/inscripcion.routes.js` aplica `writeLimiter` y llama a `crearLibre`.
2. `controllers/inscripcion.controller.js` pasa el cuerpo al servicio y responde `201`.
3. `services/inscripcion.service.js` valida grado, DNI (RN-04), celular y N.° de operación (RN-05) y fija el monto en S/ 15 (RN-01).
4. `repositories/inscripcion.repository.js` comprueba que el DNI no exista e inserta el registro.
5. Si algo falla, `middlewares/errores.js` convierte el error en `400`, `409` o `500`.

## Seguridad (resumen)

- HTTPS obligatorio en Fly.io (`force_https`).
- Inscripciones: cookie `adm` HttpOnly, SameSite=Strict y Secure, firmada con HMAC-SHA256; rate limiting en el login (10 intentos cada 15 min) y en los formularios (60 envíos cada 10 min); cabeceras `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy`.
- Resultados: bloqueo de 10 minutos tras 5 claves incorrectas; la página pública usa un rol de solo lectura que solo ve `vista_resultados`.
- Todas las consultas son parametrizadas (no se concatenan datos del usuario en el SQL).
- Los secretos se guardan con `fly secrets set` y nunca en el repositorio.

## Frontend (React + Tailwind CSS)

Cada sistema tiene su propio proyecto de frontend, creado con **Vite**, **React 19** y **Tailwind CSS 4**.

```text
Componente React  ──(evento)──▶  services/api.js  ──fetch JSON──▶  API REST
      ▲                                                              │
      └────────────── estado (useState) ◀───── respuesta ────────────┘
```

| Concepto | Dónde se ve |
|---|---|
| **Componentes** | Cada parte de la página es una función reutilizable: `Tarjeta`, `Campo`, `BloquePago`, `Grado`, `Tabla`, `FichaPuntaje`… |
| **Estado** (`useState`) | Lo que escribe el usuario, los alumnos de cada grado y los datos que llegan de la API. Cuando el estado cambia, React vuelve a dibujar solo lo necesario. |
| **Efectos** (`useEffect`) | La carga inicial, la actualización cada 20 s, el contador «Actualizado hace X s» y la animación del fondo. |
| **Props** | Datos y funciones que un componente le pasa a otro (por ejemplo, `onVerificar` del panel a cada fila). |
| **Tailwind CSS** | El estilo se escribe con clases utilitarias en el JSX (`rounded-xl bg-tarjeta p-6`). Los colores y las fuentes del concurso están en `@theme` dentro de `src/index.css`, así que se usan como `bg-tarjeta`, `text-suave` o `font-serif`. |
| **Separación de responsabilidades** | `components/` (interfaz), `services/` (API), `config/` (datos del concurso) y `utils/` (validaciones), igual que las capas del backend. |

En desarrollo, `npm run dev` levanta Vite con recarga automática y reenvía `/api` al backend. En producción, `npm run build` genera archivos estáticos optimizados en `dist/`, y el backend Express los sirve en el mismo dominio que la API. Por eso la cookie de sesión del organizador sigue funcionando sin configurar CORS.

La migración mantuvo el mismo diseño, los mismos textos, las mismas validaciones y las mismas llamadas a la API. Se comprobó comparando la versión anterior y la nueva en el navegador (ver `observaciones-informe.md`).
