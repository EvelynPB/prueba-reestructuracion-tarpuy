# Base de datos

Motor: **PostgreSQL** alojado en **Neon**. Los dos sistemas comparten la misma base.

## Scripts (`database/scripts/`)

| Orden | Script | Quién lo ejecuta | Contenido |
|---|---|---|---|
| 1 | `01_inscripciones.sql` | El backend de inscripciones, al arrancar (es idempotente) | Tablas `fichas`, `asesores`, `alumnos`, `libres` e índices |
| 2 | `02_resultados.sql` | Una persona, una sola vez, en el editor SQL de Neon | Tablas `resultados` y `config_resultados`, vista `vista_resultados` y rol `resultados_lector` |
| 3 | `03_resultados_roles.sql` | Una persona, una sola vez | Extensión `unaccent` y rol `resultados_admin` con permisos limitados |

Antes de ejecutar los scripts 2 y 3, reemplaza `PON_UNA_CLAVE_FUERTE` y `PON_OTRA_CLAVE_FUERTE_DISTINTA` por contraseñas reales, sin subirlas al repositorio.

> **Importante:** los scripts 2 y 3 no están completos respecto a lo que usa el código en producción. Ver la sección siguiente.

## Objetos que usa el código y no están en los scripts

El backend de resultados usa estos objetos, pero ningún script del repositorio los crea. Lo más probable es que se crearan o modificaran a mano en Neon:

| Objeto | Dónde se usa | Qué falta |
|---|---|---|
| Tabla `pagos_adicionales` | `POST /api/admin/alumno` | La definición de la tabla |
| Vista `vista_ranking_colegios` | `GET /api/ranking-colegios` | La definición de la vista |
| Columnas `rindio`, `maximo`, `porcentaje` de `vista_resultados` | `GET /api/resultados` | La versión del script solo define hasta `merito_general` |
| Permisos de `resultados_admin` para `INSERT` en `alumnos`, `libres` y `pagos_adicionales`, `UPDATE` en `fichas` y `SELECT (medio)` en `libres` | Inscripciones de último momento | El script 03 solo concede `SELECT` sobre columnas concretas |
| Permiso de `resultados_lector` sobre `vista_ranking_colegios` | Ranking público | No se concede en el script 02 |

**Recomendación:** exportar desde Neon la definición actual (por ejemplo con `pg_dump --schema-only`) y guardarla como `database/scripts/04_cambios_produccion.sql`. Sin eso, el sistema de resultados no se puede reconstruir desde el repositorio.

## Modelo actual (tablas reales)

```text
fichas (1) ──< asesores
   │
   └──────< alumnos (1) ──o resultados (0..1)
libres (1) ──────────────o resultados (0..1)
config_resultados (una sola fila: publicado)
```

| Tabla | Propósito | Restricciones principales |
|---|---|---|
| `fichas` | Datos de la I.E. y del pago de la delegación | `tipo` ∈ {Estatal, Privado}; `medio` ∈ {Yape, Transferencia}; `verificado` FALSE por defecto |
| `asesores` | Asesor por nivel | FK `ficha_id` → `fichas` (ON DELETE CASCADE) |
| `alumnos` | Alumno de una delegación | `dni` UNIQUE; FK `ficha_id` → `fichas` |
| `libres` | Alumno libre con su pago | `dni` UNIQUE |
| `resultados` | Puntaje y hora de entrega | `alumno_id` UNIQUE o `libre_id` UNIQUE (exactamente uno) |
| `config_resultados` | Interruptor de publicación | Una sola fila (`id = 1`) |

Además, el servidor impide que un mismo DNI aparezca a la vez en `alumnos` y en `libres`.
