# Se construye desde la RAÍZ del repositorio (necesita frontend/ y database/):
#   fly deploy . --config backend/inscripciones/fly.toml --dockerfile backend/inscripciones/Dockerfile
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/inscripciones/package.json backend/inscripciones/package-lock.json ./backend/inscripciones/
RUN cd backend/inscripciones && npm ci --omit=dev
COPY backend/inscripciones ./backend/inscripciones
COPY frontend/inscripciones ./frontend/inscripciones
COPY database/scripts ./database/scripts
WORKDIR /app/backend/inscripciones
EXPOSE 8080
CMD ["node", "server.js"]
