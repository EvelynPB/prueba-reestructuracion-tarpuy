import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tres páginas: / (inicio), /resultados (público) y /admin (panel de carga).
// En desarrollo (npm run dev) las peticiones /api van al backend de resultados (puerto 3000).
// En producción (npm run build) se genera dist/, que sirve el backend.
const paginasSinExtension = {
  name: 'paginas-sin-extension',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/resultados' || req.url === '/admin') req.url += '.html';
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), paginasSinExtension],
  server: {
    port: 5174,
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    rollupOptions: {
      input: {
        inicio: resolve(import.meta.dirname, 'index.html'),
        resultados: resolve(import.meta.dirname, 'resultados.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
});
