# Base de datos (PostgreSQL)

Motor: **PostgreSQL 16**. Los dos sistemas comparten la misma base y se conectan con el driver estándar [`pg`](https://node-postgres.com/), así que funciona con un PostgreSQL local, con Neon (el proveedor actual de producción) o con cualquier otro servicio PostgreSQL.

## 1. Archivos

```text
database/
├── scripts/
│   ├── 01_inscripciones.sql   Tablas del Sistema de Inscripciones
│   ├── 02_resultados.sql      Tablas y vistas del Sistema de Resultados
│   ├── 03_roles.sql           Roles de la aplicación y sus permisos
│   └── 04_datos_prueba.sql    Datos ficticios (solo desarrollo)
├── instalar.sh                Ejecuta los scripts en orden con psql
└── docker/initdb.sh           Lo usa docker-compose.yml la primera vez
```

Todos los scripts son **reejecutables**: usan `IF NOT EXISTS`, `CREATE OR REPLACE` o `ON CONFLICT`, así que volver a correrlos no borra datos. Sirven tanto para crear una base nueva como para actualizar una existente.

| Script | Quién lo ejecuta | Contenido |
|---|---|---|
| `01_inscripciones.sql` | `instalar.sh` y también el backend de inscripciones al arrancar | `fichas`, `asesores`, `alumnos`, `libres` e índices |
| `02_resultados.sql` | `instalar.sh` (con el usuario dueño de la base) | `resultados`, `config_resultados`, `pagos_adicionales`, `vista_resultados`, `vista_ranking_colegios`, extensión `unaccent` |
| `03_roles.sql` | `instalar.sh`, que le pasa las contraseñas como variables de psql | Roles `resultados_lector` y `resultados_admin` con permisos mínimos |
| `04_datos_prueba.sql` | `instalar.sh --datos-prueba` | 3 colegios, 12 alumnos y 2 alumnos libres ficticios, con puntajes |

## 2. Instalación

### Desarrollo con Docker

Desde la raíz del repositorio:

```bash
docker compose up -d
```

Crea la base `concurso` (usuario `concurso`, contraseña `concurso_local`) con todo lo anterior y los datos de prueba. Para empezar de cero:

```bash
docker compose down -v
```

### Desarrollo o producción con psql

Requiere el cliente `psql` y una base vacía o existente. `DATABASE_URL` debe usar el **usuario dueño** de la base (no los roles de la aplicación):

```bash
export DATABASE_URL="postgresql://dueño:clave@host:5432/base?sslmode=require"
export CLAVE_LECTOR="contraseña-segura-1"
export CLAVE_ADMIN="contraseña-segura-2"
./database/instalar.sh
```

Agrega `--datos-prueba` solo en desarrollo. Las contraseñas de los roles nunca se escriben en los archivos: se pasan como variables.

Para **Neon** sirve el mismo comando, con la cadena de conexión del dueño del proyecto (la que aparece en *Connect*). El editor SQL web de Neon no entiende las variables de psql de `03_roles.sql`; por eso hay que usar `psql` o `instalar.sh`.

## 3. Conexiones de la aplicación

| Sistema | Variable | Rol | Puede |
|---|---|---|---|
| Inscripciones | `DATABASE_URL` | Dueño de la base | Crear tablas al arrancar, registrar inscripciones y leer todo para el panel y el Excel |
| Resultados (público) | `DATABASE_URL_LECTOR` | `resultados_lector` | Leer solo `vista_resultados`, `vista_ranking_colegios` y el interruptor de publicación |
| Resultados (panel) | `DATABASE_URL_ADMIN` | `resultados_admin` | Leer nombre, DNI, nivel y grado de los alumnos; escribir puntajes; publicar; agregar inscritos de último momento |

Así, aunque alguien comprometiera la página pública, no podría leer DNI, correos ni teléfonos, y el panel de resultados no puede tocar los datos de pago ni los contactos de las fichas. Si en desarrollo solo defines `DATABASE_URL`, el backend de resultados la usa para las dos conexiones, pero pierde esa separación.

## 4. Modelo de datos

```text
fichas (1) ──< asesores
   │  └──────< pagos_adicionales
   └──────< alumnos (1) ──o resultados (0..1)
libres (1) ──────────────o resultados (0..1)
config_resultados (una sola fila: publicado)
```

| Tabla | Propósito | Restricciones principales |
|---|---|---|
| `fichas` | Datos de la I.E. y del pago de la delegación | `tipo` ∈ {Estatal, Privado}; `medio` ∈ {Yape, Transferencia}; `verificado` FALSE por defecto |
| `asesores` | Asesor por nivel | FK `ficha_id` → `fichas` (ON DELETE CASCADE) |
| `alumnos` | Alumno de una delegación | `dni` UNIQUE; FK `ficha_id` → `fichas` |
| `libres` | Alumno libre con su pago | `dni` UNIQUE; `medio` ∈ {Yape, Plin, Transferencia, Efectivo} |
| `pagos_adicionales` | Pago de un alumno agregado a una delegación desde el panel | FK `ficha_id` → `fichas`; `monto` ≥ 0 |
| `resultados` | Puntaje y hora de entrega | `alumno_id` UNIQUE o `libre_id` UNIQUE (exactamente uno) |
| `config_resultados` | Interruptor de publicación (RN-07) | Una sola fila (`id = 1`) |

El servidor impide, además, que un mismo DNI aparezca a la vez en `alumnos` y en `libres`.

### Vistas

**`vista_resultados`**: un registro por inscrito, sin DNI ni contactos. Solo devuelve filas cuando los resultados están publicados.

| Columna | Significado |
|---|---|
| `rindio` | `false` si no tiene puntaje (aparece como «No rindió», con 0 puntos y sin mérito) |
| `maximo` | 200 en Inicial; 150 en Primaria y Secundaria |
| `porcentaje` | `puntaje / maximo × 100` |
| `merito` | Puesto en su nivel y grado: mayor puntaje; si empatan, la hora de entrega más temprana |
| `merito_general` | Puesto entre todos, por porcentaje del máximo y luego por hora de entrega |

**`vista_ranking_colegios`**: un registro por delegación (sin alumnos libres). En cada nivel se promedia el porcentaje del máximo de **todos** sus inscritos (quien no rindió cuenta como 0). Si nadie del nivel rindió, el nivel queda vacío («—») y suma 0. `acumulado` es la suma de los tres niveles y `promedio` es `acumulado ÷ 3`.

## 5. Objetos reconstruidos

La versión anterior del repositorio no tenía la tabla `pagos_adicionales`, la vista `vista_ranking_colegios`, las columnas `rindio`, `maximo` y `porcentaje` de `vista_resultados`, ni varios permisos, aunque el código los usaba. Seguramente se crearon a mano en Neon.

Esos objetos (marcados con `[Reconstruida]` en `02_resultados.sql`) se reescribieron a partir de cómo los usan el backend y la página de resultados, incluida la explicación que muestra la propia página. **Pueden no ser idénticos a los de producción.** Antes de ejecutar `instalar.sh` sobre la base de producción:

1. Exporta la definición actual desde Neon:
   ```bash
   pg_dump "$DATABASE_URL" --schema-only --no-owner > produccion-esquema.sql
   ```
2. Compara `vista_resultados` y `vista_ranking_colegios` con las de `02_resultados.sql`.
3. Si producción calcula algo distinto, copia su definición en `02_resultados.sql`, para que el repositorio refleje lo real.

## 6. Copias de seguridad

```bash
pg_dump "$DATABASE_URL" --format=custom --file=respaldo-$(date +%Y%m%d).dump
```

Para restaurar en una base vacía:

```bash
pg_restore --dbname="$DATABASE_URL" --no-owner respaldo-AAAAMMDD.dump
```

Conviene hacerlo antes del cierre de inscripciones y antes de publicar los resultados (recomendación de la sección 16 del informe). Neon también guarda un historial que permite volver a un momento anterior.
