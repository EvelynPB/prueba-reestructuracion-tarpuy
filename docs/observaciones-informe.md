# Observaciones: informe (Word) frente al código

Revisión del informe *PROYECTO_PLATAFORMA_CONCURSO_MATEMATICA_TARPUY_2026* comparado con el código del repositorio. Conviene corregir el informe (o el código) antes de la entrega, porque un evaluador que compare ambos encontrará estas diferencias.

## 1. Diferencias que conviene corregir en el informe

| Sección del informe | Lo que dice el informe | Lo que hace el código | Sugerencia |
|---|---|---|---|
| 7 (Tabla 4) y 10 (Tabla 10) | Se usa un ORM | No hay ORM: se usan consultas SQL parametrizadas con `pg` y `@neondatabase/serverless` | Reemplazar «ORM» por «consultas parametrizadas» (protegen igual contra la inyección SQL) |
| 7 (Tabla 4) | La contraseña del organizador se protege con bcrypt | La contraseña está en una variable de entorno y se compara en tiempo constante (`timingSafeEqual`); no hay bcrypt | Describir el mecanismo real o implementar bcrypt |
| 9.4 (Tabla 8) | Tablas `ficha_delegacion`, `asesor`, `alumno`, `inscripcion_libre`, `resultado`, `usuario_admin`, `configuracion` | Tablas `fichas`, `asesores`, `alumnos`, `libres`, `resultados`, `config_resultados`; no existe una tabla de usuarios | Actualizar el diccionario de datos y el diagrama E-R (ver `docs/base-de-datos.md`) |
| 9.4 | `inscripcion_libre` tiene FK a `alumno` | `libres` es una tabla independiente con su propio DNI | Corregir el diagrama |
| 9.5 (Tabla 9) | `POST /api/admin/resultados` y `PATCH /api/admin/publicacion` | Las rutas reales son `/api/admin/guardar`, `/guardar-lote`, `/importar` y `POST /api/admin/config` | Usar la tabla de `docs/api.md` |
| 9.5 (Tabla 9) | El inicio de sesión del organizador es igual en ambos sistemas | Inscripciones usa cookie de sesión; Resultados usa una clave en la cabecera `x-admin-key` | Mencionar los dos mecanismos |
| 1.3.4 y 5.1 | El concurso va de Inicial 5 años a 5.° de Secundaria | El código también admite **Inicial 4 años** | Confirmar con el colegio cuál es correcto |
| 8.4 (RN-04) | El DNI tiene exactamente 8 dígitos | En 5.° de Primaria también se acepta un código de 14 dígitos; en el panel de resultados se aceptan de 8 a 12 caracteres alfanuméricos | Documentar la excepción |
| 14.2 (mejora 1) y 16 | Validar en el backend que el DNI sea único se plantea como mejora pendiente | **Ya está implementado**: el servidor rechaza DNI repetidos entre delegaciones y alumnos libres (409) | Pasarlo a «fortalezas» |
| 14.2 (mejora 5) | El rate limiting es una propuesta | **Ya existe** en inscripciones (login y formularios) y en resultados (login) | Indicar que existe y que falta el CAPTCHA |
| 6 y 9.1 | Una sola API REST | Dos APIs independientes, una por sistema | Ajustar la figura de arquitectura (ver `docs/arquitectura.md`) |
| RNF-08 | Código organizado por capas | Antes de esta reestructuración, cada backend estaba en un único `server.js` | Ahora sí se cumple: `routes`, `controllers`, `services`, `repositories` |

## 2. Problemas encontrados en el código (no corregidos)

La reestructuración **no cambió el comportamiento** del sistema. Estos puntos quedan pendientes:

1. **Scripts SQL incompletos.** La tabla `pagos_adicionales`, la vista `vista_ranking_colegios`, tres columnas de `vista_resultados` y varios permisos no están en `database/scripts/`. Detalle en `docs/base-de-datos.md`.
2. **`GET` y `POST /api/admin/config` no capturan errores de la base.** Si Neon falla en ese momento, la promesa rechazada no se maneja y, con Node 20, el proceso puede detenerse. Solución: envolver ambos controladores en `try/catch`, como el resto.
3. **Faltaba el ícono `logo-icono.png`.** Las páginas de resultados lo pedían, pero el archivo no existe. Se cambió para que usen `img/logo.png` (es el único cambio visible).
4. **`frontend/resultados/index.html` es una página de ejemplo** («Esta es una página de inicio de ejemplo…»). En producción conviene redirigir `/` a `/resultados`.
5. **El bloqueo por intentos fallidos de resultados vive en memoria.** Se reinicia si la máquina se apaga, y no se comparte si hay varias máquinas.
6. **Datos personales en la vista pública.** `vista_resultados` no expone el DNI (bien), pero la Ley N.° 29733 que cita el informe también recomienda la casilla de consentimiento, que todavía no existe en el formulario (mejora 6).

## 3. Cambios hechos en la reestructuración

- Se separó el frontend del backend: `frontend/inscripciones` y `frontend/resultados`, con el CSS y el JS en archivos propios (antes estaban incrustados en el HTML).
- Cada backend se dividió en capas: `config`, `routes`, `controllers`, `services`, `repositories`, `middlewares` y `utils`.
- El esquema de inscripciones, que estaba dentro de `server.js`, pasó a `database/scripts/01_inscripciones.sql`; el servidor lo sigue ejecutando al arrancar.
- Los Dockerfile ahora se construyen desde la raíz (ver `docs/despliegue.md`).
- Se reescribió el `README.md`; el anterior se veía mal en GitHub porque tenía caracteres escapados al copiarlo desde Word.

### Cómo se verificó

- Inscripciones: se levantaron la versión original y la nueva contra un PostgreSQL local y se enviaron las mismas 24 peticiones a ambas (casos CP-01 a CP-10 del informe, duplicados, sesión, verificación, Excel y errores). Las 22 respuestas de la API fueron idénticas; las otras 2 son los archivos nuevos `css/estilos.css` y `js/app.js`, que antes no existían.
- Inscripciones (navegador): el formulario de alumno libre se llenó y envió en ambas versiones, con el mismo mensaje de confirmación y sin errores de JavaScript.
- Resultados: se compararon las páginas, los archivos estáticos, las respuestas 401/429 y las validaciones que no necesitan base de datos. **No se pudo probar contra Neon**, porque el driver HTTP de Neon no funciona con un PostgreSQL local; hay que probar el panel de resultados con la base real antes de pasarlo al repositorio del curso.
