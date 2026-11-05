# Se construye desde la RAÍZ del repositorio:
#   fly deploy . --config backend/inscripciones/fly.toml --dockerfile backend/inscripciones/Dockerfile

# ---------- Etapa 1: compila el frontend (React + Tailwind) ----------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend/inscripciones
COPY frontend/inscripciones/package.json frontend/inscripciones/package-lock.json ./
RUN npm ci
COPY frontend/inscripciones ./
RUN npm run build

# ---------- Etapa 2: servidor Express, que sirve la API y el frontend compilado ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/inscripciones/package.json backend/inscripciones/package-lock.json ./backend/inscripciones/
RUN cd backend/inscripciones && npm ci --omit=dev
COPY backend/inscripciones ./backend/inscripciones
COPY --from=frontend /app/frontend/inscripciones/dist ./frontend/inscripciones/dist
COPY database/scripts ./database/scripts
WORKDIR /app/backend/inscripciones
EXPOSE 8080
CMD ["node", "server.js"]
