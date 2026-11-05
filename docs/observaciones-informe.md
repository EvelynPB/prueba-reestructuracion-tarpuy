# Observaciones: informe (Word) frente al código

Revisión del informe *PROYECTO_PLATAFORMA_CONCURSO_MATEMATICA_TARPUY_2026* comparado con el código del repositorio. Conviene corregir el informe (o el código) antes de la entrega, porque un evaluador que compare ambos encontrará estas diferencias.

## 1. Diferencias que conviene corregir en el informe

| Sección del informe | Lo que dice el informe | Lo que hace el código | Sugerencia |
|---|---|---|---|
| 7 (Tabla 4) y 10 (Tabla 10) | Se usa un ORM | No hay ORM: se usan consultas SQL parametrizadas con el driver `pg` | Reemplazar «ORM» por «consultas parametrizadas» (protegen igual contra la inyección SQL) |
| 7 (Tabla 4) | La contraseña del organizador se protege con bcrypt | La contraseña está en una variable de entorno y se compara en tiempo constante (`timingSafeEqual`); no hay bcrypt | Describir el mecanismo real o implementar bcrypt |
| 9.4 (Tabla 8) | Tablas `ficha_delegacion`, `asesor`, `alumno`, `inscripcion_libre`, `resultado`, `usuario_admin`, `configuracion` | Tablas `fichas`, `asesores`, `alumnos`, `libres`, `pagos_adicionales`, `resultados`, `config_resultados`; no existe una tabla de usuarios | Actualizar el diccionario de datos y el diagrama E-R con `docs/base-de-datos.md` |
| 9.4 | `inscripcion_libre` tiene FK a `alumno` | `libres` es una tabla independiente con su propio DNI | Corregir el diagrama |
| 9.4 / 10 | Una sola credencial de base de datos | Tres conexiones: el dueño (inscripciones), `resultados_lector` y `resultados_admin` (permisos mínimos) | Es una fortaleza de seguridad: conviene mencionarla en la Tabla 10 |
| 9.5 (Tabla 9) | `POST /api/admin/resultados` y `PATCH /api/admin/publicacion` | Las rutas reales son `/api/admin/guardar`, `/guardar-lote`, `/importar` y `POST /api/admin/config` | Usar la tabla de `docs/api.md` |
| 9.5 (Tabla 9) | El inicio de sesión del organizador es igual en ambos sistemas | Inscripciones usa cookie de sesión; Resultados usa una clave en la cabecera `x-admin-key` | Mencionar los dos mecanismos |
| 1.3.4 y 5.1 | El concurso va de Inicial 5 años a 5.° de Secundaria | El código también admite **Inicial 4 años** | Confirmar con el colegio cuál es correcto |
| 8.4 (RN-04) | El DNI tiene exactamente 8 dígitos | En 5.° de Primaria también se acepta un código de 14 dígitos; en el panel de resultados se aceptan de 8 a 12 caracteres alfanuméricos | Documentar la excepción |
| 8.4 (RN-06) | Solo los alumnos con pago verificado entran en el orden de mérito | Las vistas de resultados incluyen a todos los inscritos, verificados o no | Decidir cuál es la regla y ajustar el informe o la vista |
| 14.2 (mejora 1) y 16 | Validar en el backend que el DNI sea único se plantea como mejora pendiente | **Ya está implementado**: el servidor rechaza DNI repetidos entre delegaciones y alumnos libres (409) | Pasarlo a «fortalezas» |
| 14.2 (mejora 5) | El rate limiting es una propuesta | **Ya existe** en inscripciones (login y formularios) y en resultados (login) | Indicar que existe y que falta el CAPTCHA |
| 6 y 9.1 | Una sola API REST | Dos APIs independientes, una por sistema | Ajustar la figura de arquitectura (ver `docs/arquitectura.md`) |
| 7 (Tabla 4) | Frontend en HTML5, CSS3 y JavaScript | Ahora el frontend usa **React 19 + Tailwind CSS 4** (con Vite) | Actualizar la Tabla 4 y pasar la mejora 8 («Migrar el frontend a React») de propuesta a hecha |
| RNF-08 | Código organizado por capas | Antes de esta reestructuración, cada backend estaba en un único `server.js` | Ahora sí se cumple: `routes`, `controllers`, `services`, `repositories` |

## 2. Problemas encontrados en el código

### Corregidos

1. **Scripts SQL incompletos.** Faltaban la tabla `pagos_adicionales`, la vista `vista_ranking_colegios`, tres columnas de `vista_resultados` y varios permisos. Se reconstruyeron en `02_resultados.sql` y `03_roles.sql`. **Hay que compararlos con producción** (ver la sección 5 de `docs/base-de-datos.md`).
2. **Permiso insuficiente del rol público.** El script original solo daba acceso a la columna `publicado` de `config_resultados`, pero el servidor consulta `WHERE id = 1`, que también necesita la columna `id`. Con el script original, la página pública respondía «No se pudieron cargar los resultados». Se descubrió al probar con PostgreSQL local.
3. **Medios de pago del panel.** El panel registra alumnos libres pagados con Plin o en efectivo, pero la tabla `libres` solo admitía Yape y Transferencia, así que esa inserción fallaba. Se amplió la restricción en `02_resultados.sql`.
4. **`GET` y `POST /api/admin/config` no capturaban errores de la base.** Si la base fallaba en ese momento, el proceso podía detenerse. Ahora responden 500, como el resto de rutas.
5. **Dependencia del driver HTTP de Neon.** El backend de resultados solo funcionaba con Neon. Ahora usa `pg`, igual que inscripciones, y funciona con cualquier PostgreSQL.
6. **Faltaba el ícono `logo-icono.png`.** Las páginas de resultados ahora usan `img/logo.png`.

### Pendientes

1. **`frontend/resultados/index.html` es una página de ejemplo.** En producción conviene redirigir `/` a `/resultados`.
2. **El bloqueo por intentos fallidos de resultados vive en memoria.** Se reinicia si la máquina se apaga, y no se comparte si hay varias máquinas.
3. **Consentimiento de datos personales.** `vista_resultados` no expone el DNI (bien), pero la casilla de consentimiento de la Ley N.° 29733 (mejora 6 del informe) todavía no existe en el formulario.

## 3. Cambios hechos en la reestructuración

- Se separó el frontend del backend: `frontend/inscripciones` y `frontend/resultados`, con el CSS y el JS en archivos propios (antes estaban incrustados en el HTML).
- Cada backend se dividió en capas: `config`, `routes`, `controllers`, `services`, `repositories`, `middlewares` y `utils`.
- Base de datos: los dos backends usan `pg`; los scripts están en `database/scripts/`, son reejecutables y se instalan con `database/instalar.sh` o con `docker compose up`.
- Frontend migrado a **React + Tailwind CSS**: componentes, estado con `useState`, servicios de API separados y estilos con clases utilitarias. Se mantuvieron el diseño, los textos y el comportamiento.
- Los Dockerfile se construyen desde la raíz y compilan el frontend en una primera etapa (ver `docs/despliegue.md`).
- Se reescribió el `README.md`; el anterior se veía mal en GitHub porque tenía caracteres escapados al copiarlo desde Word.

### Cómo se verificó

- **Inscripciones:** se levantaron la versión original y la nueva contra PostgreSQL 16 y se enviaron las mismas 24 peticiones a ambas (casos CP-01 a CP-10 del informe, duplicados, sesión, verificación, Excel y errores). Las 22 respuestas de la API fueron idénticas; las otras 2 son los archivos nuevos `css/estilos.css` y `js/app.js`. En el navegador, el formulario de alumno libre funcionó igual en ambas versiones.
- **Scripts SQL:** instalación desde cero, segunda ejecución sobre la misma base (sin errores ni datos duplicados), actualización de una base creada con los scripts antiguos (la vista gana las columnas nuevas sin perder datos) y el script de inicio de Docker.
- **Resultados con PostgreSQL y roles de permisos mínimos:** 23 casos (lectura pública, publicar y ocultar, búsqueda, guardado individual y en lote, importación, alumnos de último momento, DNI duplicado y clave incorrecta) y 8 comprobaciones de que los roles **no** pueden leer DNI, correos ni teléfonos, ni modificar lo que no les corresponde. La página pública mostró los rankings sin errores.
- **Frontend React frente al original** (mismo guion en el navegador sobre la versión anterior y la nueva):
  - Inscripciones: 16 de 16 pasos idénticos (validaciones, DNI repetido, asesor faltante, contador por grado, total S/ 39, envío y limpieza del formulario, alumno libre, acceso del organizador, resumen, alerta ⚠ de operación repetida, verificación de pago y cierre de sesión).
  - Resultados públicos: 12 de 12 pasos idénticos (los tres rankings, filtros, orden por columna, búsqueda y chips).
  - Panel de resultados: 17 de 17 pasos idénticos, más el guardado en lote (clave incorrecta, publicar y ocultar, búsqueda, ficha de puntaje, carga por grado, alumno de último momento, importación de CSV).
  - Capturas de pantalla en computadora y en celular, sin diferencias visibles, y sin errores de JavaScript.
- **No probado:** la construcción real de las imágenes Docker, el despliegue en Fly.io y la ejecución contra la base de producción en Neon.
