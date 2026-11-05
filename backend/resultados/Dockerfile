# Se construye desde la RAÍZ del repositorio (necesita frontend/):
#   fly deploy . --config backend/resultados/fly.toml --dockerfile backend/resultados/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/resultados/package*.json ./backend/resultados/
RUN cd backend/resultados && npm install --omit=dev
COPY backend/resultados ./backend/resultados
COPY frontend/resultados ./frontend/resultados
WORKDIR /app/backend/resultados
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
