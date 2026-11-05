/** Rutas públicas de solo lectura. */
import { Router } from 'express';
import * as c from '../controllers/publico.controller.js';

const router = Router();
router.get('/health', c.salud);
router.get('/api/resultados', c.resultados);
router.get('/api/ranking-colegios', c.rankingColegios);

export default router;
