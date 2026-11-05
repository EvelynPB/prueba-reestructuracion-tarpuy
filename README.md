\# Plataforma Web para la Gestión de Inscripciones y Publicación de Resultados



Proyecto final del curso \*\*Fullstack Developer Software\*\* de la carrera de \*\*Ingeniería de Software con Inteligencia Artificial – SENATI\*\*.



La plataforma fue desarrollada para apoyar la gestión del \*\*XI Concurso Nacional de Matemática Lima Este 2026 – Olimpiada Tarpuyana\*\*, organizado por la IEP Colegio Tarpuy Moderno.



\---



\## Descripción del proyecto



El sistema permite digitalizar dos procesos principales del concurso:



1\. \*\*Registro de participantes\*\*

2\. \*\*Publicación y administración de resultados\*\*



La solución busca reducir el trabajo manual relacionado con inscripciones, verificación de pagos, registro de participantes y publicación de resultados.



El proyecto está compuesto por dos aplicaciones web que trabajan sobre una base de datos relacional PostgreSQL.



\---



\## Sistemas incluidos



\### Sistema de Inscripciones



Permite registrar participantes mediante dos modalidades:



\- Delegación de una institución educativa.

\- Alumno libre.



Principales funciones:



\- Registro de institución educativa.

\- Registro de asesores por nivel.

\- Registro de estudiantes por grado.

\- Máximo de 10 estudiantes por grado.

\- Validación de DNI.

\- Control de duplicidad de participantes.

\- Cálculo automático del monto de inscripción.

\- Registro del medio y número de operación.

\- Registro de alumno libre.

\- Panel administrativo.

\- Verificación de pagos.

\- Exportación de inscritos a Excel.



\---



\### Sistema de Resultados



Permite administrar y publicar los resultados del concurso.



Principales funciones:



\- Búsqueda de participantes.

\- Registro individual de puntajes.

\- Registro de hora de entrega.

\- Registro de puntajes en lote.

\- Importación de resultados.

\- Incorporación de participantes de último momento.

\- Cálculo del orden de mérito.

\- Ranking por instituciones.

\- Control de publicación de resultados.

\- Consulta pública de resultados.



\---



\## Arquitectura general



La plataforma utiliza una arquitectura cliente-servidor.



```text

┌──────────────────────────────┐

│          FRONTEND            │

│                              │

│ HTML + CSS + JavaScript      │

│ Fetch API                    │

└──────────────┬───────────────┘

&#x20;              │

&#x20;              │ HTTP / JSON

&#x20;              ▼

┌──────────────────────────────┐

│           BACKEND            │

│                              │

│ Node.js + Express            │

│ API REST                     │

│ Validaciones                 │

│ Autenticación                │

└──────────────┬───────────────┘

&#x20;              │

&#x20;              │ SQL

&#x20;              ▼

┌──────────────────────────────┐

│       BASE DE DATOS          │

│                              │

│ PostgreSQL                   │

└──────────────────────────────┘

```



\---



\## Tecnologías utilizadas



\### Frontend



\- HTML5

\- CSS3

\- JavaScript ES6+

\- Fetch API

\- Diseño responsive



\### Backend



\- Node.js

\- Express.js



\### Base de datos



\- PostgreSQL



\### Librerías principales



\- `pg`

\- `express`

\- `express-rate-limit`

\- `exceljs`

\- `@neondatabase/serverless`



\### Herramientas de desarrollo



\- Git

\- GitHub

\- WebStorm / Visual Studio Code

\- PostgreSQL

\- npm



\### Despliegue



\- Docker

\- Fly.io



\---



\## Estructura del repositorio



```text

Grupo-2---Implementaci-n-de-un-software-web/

│

├── concurso-tarpuy-main/

│   │

│   ├── public/

│   ├── server.js

│   ├── package.json

│   ├── Dockerfile

│   └── fly.toml

│

├── Resultados-ConcursoMat2026-main/

│   │

│   ├── public/

│   ├── sql/

│   ├── server.js

│   ├── package.json

│   ├── Dockerfile

│   └── fly.toml

│

├── .gitignore

└── README.md

```



\---



\## Flujo general del sistema



\### Inscripción por delegación



```text

Institución educativa

&#x20;       ↓

Datos de la I.E.

&#x20;       ↓

Registro de asesores

&#x20;       ↓

Registro de alumnos

&#x20;       ↓

Validación de datos

&#x20;       ↓

Registro de pago

&#x20;       ↓

Confirmación de inscripción

```



\### Publicación de resultados



```text

Participantes inscritos

&#x20;       ↓

Registro de puntajes

&#x20;       ↓

Validación

&#x20;       ↓

Cálculo de resultados

&#x20;       ↓

Orden de mérito

&#x20;       ↓

Publicación

&#x20;       ↓

Consulta pública

```



\---



\# Instalación local



\## Requisitos



Antes de ejecutar el proyecto se necesita tener instalado:



\- Node.js

\- npm

\- PostgreSQL

\- Git



Verificar Node.js:



```bash

node -v

```



Verificar npm:



```bash

npm -v

```



\---



\## Clonar el repositorio



```bash

git clone https://github.com/2026-II-Senati/Grupo-2---Implementaci-n-de-un-software-web.git

```



Entrar al proyecto:



```bash

cd Grupo-2---Implementaci-n-de-un-software-web

```



\---



\# Base de datos local



Crear una base de datos PostgreSQL:



```sql

CREATE DATABASE tarpuy\_local;

```



Ejemplo de conexión:



```text

postgresql://postgres:TU\_CLAVE@localhost:5432/tarpuy\_local

```



> Las contraseñas y secretos no deben almacenarse directamente en GitHub.



\---



\# Ejecutar el Sistema de Inscripciones



Entrar a la carpeta:



```bash

cd concurso-tarpuy-main

```



Instalar dependencias:



```bash

npm install

```



Crear un archivo:



```text

.env

```



Ejemplo:



```env

DATABASE\_URL=postgresql://postgres:TU\_CLAVE@localhost:5432/tarpuy\_local

ADMIN\_PASSWORD=admin123

SESSION\_SECRET=clave\_segura\_para\_desarrollo\_local

```



Ejecutar:



```bash

node --env-file=.env server.js

```



El sistema estará disponible en:



```text

http://localhost:8080

```



\---



\# Ejecutar el Sistema de Resultados



Abrir otra terminal y entrar a:



```bash

cd Resultados-ConcursoMat2026-main

```



Instalar dependencias:



```bash

npm install

```



Crear:



```text

.env

```



Ejemplo:



```env

DATABASE\_URL\_LECTOR=postgresql://postgres:TU\_CLAVE@localhost:5432/tarpuy\_local

DATABASE\_URL\_ADMIN=postgresql://postgres:TU\_CLAVE@localhost:5432/tarpuy\_local

ADMIN\_PASSWORD=admin123

```



Ejecutar:



```bash

node --env-file=.env server.js

```



El servidor utiliza por defecto:



```text

http://localhost:3000

```



Resultados públicos:



```text

http://localhost:3000/resultados

```



Panel administrativo:



```text

http://localhost:3000/admin

```



\---



\# API REST



La plataforma expone diferentes endpoints para la comunicación entre frontend y backend.



\## Inscripciones



Ejemplos:



```text

POST /api/fichas

POST /api/libres



POST /api/admin/login

POST /api/admin/logout



GET   /api/admin/data

PATCH /api/admin/verify



GET   /api/admin/export.xlsx

```



\## Resultados



Ejemplos:



```text

GET /api/resultados

GET /api/ranking-colegios



GET  /api/admin/config

POST /api/admin/config



GET  /api/admin/buscar

POST /api/admin/guardar



GET  /api/admin/inscritos

POST /api/admin/guardar-lote



POST /api/admin/importar

```



\---



\# Reglas principales de negocio



\- La inscripción por delegación tiene un costo de \*\*S/ 13 por estudiante\*\*.

\- La inscripción de alumno libre tiene un costo de \*\*S/ 15\*\*.

\- Cada delegación puede registrar como máximo \*\*10 estudiantes por grado\*\*.

\- Los niveles utilizados deben contar con un asesor.

\- El DNI debe ser validado antes de registrar al participante.

\- Un estudiante no puede estar registrado dos veces.

\- Los resultados solo son visibles públicamente cuando el organizador autoriza su publicación.



\---



\# Seguridad



El proyecto incorpora diferentes controles de seguridad:



\- Variables de entorno para credenciales.

\- Validación de información en servidor.

\- Consultas SQL parametrizadas.

\- Protección de rutas administrativas.

\- Control de intentos de inicio de sesión.

\- Cookies de sesión en el sistema de inscripciones.

\- Cabeceras HTTP de seguridad.

\- Control de duplicidad de participantes.

\- Límites de solicitudes mediante `express-rate-limit`.



Los archivos `.env` no deben ser enviados al repositorio.



\---



\# Flujo de trabajo con Git y GitHub



El equipo utiliza el siguiente modelo de ramas:



```text

main

│

└── develop

&#x20;   │

&#x20;   ├── feature/documentacion

&#x20;   ├── feature/inscripciones

&#x20;   ├── feature/resultados

&#x20;   └── feature/mejoras

```



\### `main`



Contiene la versión estable del proyecto.



\### `develop`



Rama de integración donde se incorporan las funcionalidades desarrolladas por el equipo.



\### `feature/\*`



Ramas utilizadas para desarrollar funcionalidades específicas.



Ejemplo:



```bash

git checkout develop



git checkout -b feature/documentacion

```



Después de realizar los cambios:



```bash

git add .



git commit -m "docs: mejora documentación principal del proyecto"



git push origin feature/documentacion

```



Finalmente se crea un \*\*Pull Request\*\* hacia `develop`.



\---



\# Convención sugerida de commits



Ejemplos:



```text

feat: agrega nueva funcionalidad



fix: corrige error de validación



docs: actualiza documentación



refactor: reorganiza código



test: agrega pruebas



style: mejora interfaz visual

```



\---



\# Desarrollo del proyecto



El desarrollo se organizó en diferentes etapas:



\### Etapa 1 — Análisis



\- Identificación del problema.

\- Definición de actores.

\- Requerimientos funcionales.

\- Requerimientos no funcionales.

\- Reglas de negocio.



\### Etapa 2 — Diseño



\- Definición de arquitectura.

\- Diseño de base de datos.

\- Diseño de flujos.

\- Diseño de interfaces.



\### Etapa 3 — Sistema de Inscripciones



\- Formularios.

\- Validaciones.

\- Persistencia de información.

\- Panel administrativo.

\- Verificación de pagos.

\- Exportación Excel.



\### Etapa 4 — Sistema de Resultados



\- Registro de puntajes.

\- Importación de información.

\- Orden de mérito.

\- Ranking.

\- Publicación de resultados.



\### Etapa 5 — Despliegue



\- Dockerización.

\- Configuración de variables de entorno.

\- Despliegue mediante Fly.io.



\### Etapa 6 — Trabajo colaborativo



\- Git.

\- GitHub.

\- Ramas.

\- Commits.

\- Pull Requests.

\- Documentación del proyecto.



\---



\# Pruebas



Entre los casos considerados se encuentran:



\- Inscripción válida por delegación.

\- DNI inválido.

\- DNI duplicado.

\- Falta de asesor.

\- Más de 10 estudiantes por grado.

\- Pago incompleto.

\- Alumno libre válido.

\- Acceso administrativo no autorizado.

\- Contraseña incorrecta.

\- Número de operación duplicado.

\- Exportación a Excel.

\- Registro de puntajes.

\- Publicación de resultados.



\---



\# Estado del proyecto



Actualmente la plataforma cuenta con:



\- ✅ Sistema de inscripciones.

\- ✅ Inscripción por delegación.

\- ✅ Alumno libre.

\- ✅ Validaciones.

\- ✅ Panel administrativo.

\- ✅ Verificación de pagos.

\- ✅ Exportación Excel.

\- ✅ Sistema de resultados.

\- ✅ Registro de puntajes.

\- ✅ Ranking.

\- ✅ Publicación controlada.

\- ✅ PostgreSQL.

\- ✅ API REST.

\- ✅ Docker.

\- ✅ Despliegue web.

\- ✅ Control de versiones con Git y GitHub.

\- 🔄 Mejora de documentación y flujo colaborativo.



\---



\# Integrantes



\- Dávila Arenas, Hugo Javier

\- Incio Ccahuana, Anthony

\- Peralta Barboza, Evelyn Angely

\- Rimachi Taipe, Martín Alejandro

\- Román Espinoza, Diógenes

\- Torpoco Torres, Francisco



\---



\# Curso



\*\*Fullstack Developer Software\*\*



Carrera:



\*\*Ingeniería de Software con Inteligencia Artificial\*\*



Institución:



\*\*SENATI\*\*



Año:



\*\*2026\*\*



\---



\# Licencia y uso



Proyecto desarrollado con fines académicos como parte del curso \*\*Fullstack Developer Software\*\* de SENATI.



La información personal utilizada durante las pruebas debe ser ficticia o estar debidamente autorizada.

