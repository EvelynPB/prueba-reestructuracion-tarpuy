import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// En desarrollo (npm run dev) Vite sirve la página en http://localhost:5173 y reenvía
// las peticiones /api al backend de inscripciones (puerto 8080).
// En producción (npm run build) genera la carpeta dist/, que sirve el backend.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
  },
});
