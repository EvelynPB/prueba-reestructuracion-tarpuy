# API REST

Todas las respuestas son JSON salvo la exportación a Excel y `/health`. Códigos usados: `200` OK, `201` creado, `400` validación fallida, `401` sin sesión o clave incorrecta, `404` no encontrado, `409` DNI ya inscrito, `429` demasiados intentos, `500` error del servidor.

## Sistema de Inscripciones (`backend/inscripciones`)

| Método | Endpoint | Acceso | Descripción | Capa (controlador) |
|---|---|---|---|---|
| GET | `/healthz` | Público | Comprueba la conexión a la base (Fly.io) | `salud.controller` |
| POST | `/api/fichas` | Público | Registra una delegación con asesores, alumnos y pago | `inscripcion.controller.crearFicha` |
| POST | `/api/libres` | Público | Registra un alumno libre | `inscripcion.controller.crearLibre` |
| POST | `/api/admin/login` | Público | Valida la contraseña y crea la cookie de sesión | `admin.controller.login` |
| POST | `/api/admin/logout` | Organizador | Cierra la sesión | `admin.controller.logout` |
| GET | `/api/admin/data` | Organizador | Fichas (con asesores y alumnos) y alumnos libres | `admin.controller.datos` |
| PATCH | `/api/admin/verify` | Organizador | Marca o desmarca un pago como verificado | `admin.controller.verificar` |
| GET | `/api/admin/export.xlsx` | Organizador | Descarga el Excel de inscritos (4 hojas) | `admin.controller.exportarExcel` |

Ejemplo de `POST /api/libres`:

```json
{ "dni": "12345678", "nombre": "Pérez Rojas, Ana", "grado": "3° de Primaria",
  "tel": "987654321", "operacion": "00123456", "medio": "Yape", "pagador": "Rojas, María" }
```

Respuesta `201`: `{ "ok": true, "id": 1, "monto": 15 }`. El monto lo calcula el servidor; se ignora el que envíe el navegador.

Ejemplo de `PATCH /api/admin/verify`: `{ "t": "fichas", "id": 3, "v": true }` (`t` puede ser `fichas` o `libres`).

## Sistema de Resultados (`backend/resultados`)

Las rutas `/api/admin/*` exigen la cabecera `x-admin-key` con la clave del panel.

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Responde `ok` |
| GET | `/api/resultados` | Público | `{ publicado, datos }` con el orden de mérito por grado y general (caché de 8 s) |
| GET | `/api/ranking-colegios` | Público | Ranking de delegaciones |
| GET | `/api/admin/config` | Organizador | Indica si los resultados están publicados |
| POST | `/api/admin/config` | Organizador | Publica u oculta los resultados: `{ "publicado": true }` |
| GET | `/api/admin/buscar?q=` | Organizador | Busca participantes por nombre o DNI (máx. 20) |
| GET | `/api/admin/inscritos` | Organizador | Lista completa de inscritos con su puntaje |
| POST | `/api/admin/guardar` | Organizador | Guarda un puntaje: `{ tipo, id, puntaje, hora }` |
| DELETE | `/api/admin/guardar` | Organizador | Borra el puntaje de un participante: `{ tipo, id }` |
| POST | `/api/admin/guardar-lote` | Organizador | Guarda hasta 500 puntajes (todo o nada) |
| POST | `/api/admin/importar` | Organizador | Analiza (`modo` ≠ `guardar`) o importa (`modo: "guardar"`) hasta 3000 filas asignadas por DNI |
| GET | `/api/admin/colegios?q=` | Organizador | Busca delegaciones para agregar alumnos |
| GET | `/api/admin/opciones` | Organizador | Niveles, grados y medios de pago existentes |
| POST | `/api/admin/alumno` | Organizador | Agrega un alumno de último momento a una delegación |
| POST | `/api/admin/libre` | Organizador | Agrega un alumno libre de último momento |

`tipo` es `DELEGACION` o `LIBRE`. El puntaje máximo es 200 en Inicial y 150 en Primaria y Secundaria; el orden de mérito se desempata por la hora de entrega más temprana.

## Páginas

| URL | Archivo |
|---|---|
| Inscripciones `/` | `frontend/inscripciones/index.html` |
| Resultados `/resultados` | `frontend/resultados/resultados.html` |
| Resultados `/admin` | `frontend/resultados/admin.html` |
