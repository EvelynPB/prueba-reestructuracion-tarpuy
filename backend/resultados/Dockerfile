# Se construye desde la RAÍZ del repositorio:
#   fly deploy . --config backend/resultados/fly.toml --dockerfile backend/resultados/Dockerfile

# ---------- Etapa 1: compila el frontend (React + Tailwind) ----------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend/resultados
COPY frontend/resultados/package.json frontend/resultados/package-lock.json ./
RUN npm ci
COPY frontend/resultados ./
RUN npm run build

# ---------- Etapa 2: servidor Express, que sirve la API y el frontend compilado ----------
FROM node:22-alpine
WORKDIR /app
ENV PORT=3000
COPY backend/resultados/package.json backend/resultados/package-lock.json ./backend/resultados/
RUN cd backend/resultados && npm ci --omit=dev
COPY backend/resultados ./backend/resultados
COPY --from=frontend /app/frontend/resultados/dist ./frontend/resultados/dist
WORKDIR /app/backend/resultados
EXPOSE 3000
CMD ["node", "server.js"]
