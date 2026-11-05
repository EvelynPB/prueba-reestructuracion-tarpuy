/**
 * Sistema de Resultados · XI Concurso Nacional de Matemática Lima Este 2026
 * Página pública de resultados y panel de carga de puntajes (Express + Neon).
 *
 * Punto de entrada. La lógica está organizada por capas en src/
 * (config, routes, controllers, services, repositories).
 */
import app from './src/app.js';
import { PORT } from './src/config/env.js';

app.listen(PORT, '0.0.0.0', () => console.log('Servidor listo'));
