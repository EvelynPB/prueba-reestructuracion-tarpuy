/** Configuración de la aplicación Express del Sistema de Resultados. */
import express from 'express';
import { FRONTEND } from './config/paths.js';
import publicoRoutes from './routes/publico.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

app.use(publicoRoutes);
app.use('/api/admin', adminRoutes);

// Páginas: /resultados -> frontend/resultados/resultados.html, /admin -> frontend/resultados/admin.html
app.use(express.static(FRONTEND, { extensions: ['html'] }));

export default app;
