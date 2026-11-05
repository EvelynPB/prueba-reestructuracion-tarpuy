/** Rutas del panel (/api/admin/*). Todas exigen la clave en la cabecera x-admin-key. */
import { Router } from 'express';
import { requiereClave } from '../middlewares/auth.js';
import * as config from '../controllers/config.controller.js';
import * as puntajes from '../controllers/puntajes.controller.js';
import * as inscripcion from '../controllers/inscripcion.controller.js';

const router = Router();
// Publicación
router.get('/config', requiereClave, config.leer);
router.post('/config', requiereClave, config.cambiar);

// Puntajes
router.get('/buscar', requiereClave, puntajes.buscar);
router.get('/inscritos', requiereClave, puntajes.inscritos);
router.post('/guardar', requiereClave, puntajes.guardar);
router.delete('/guardar', requiereClave, puntajes.borrar);
router.post('/guardar-lote', requiereClave, puntajes.guardarLote);
router.post('/importar', requiereClave, puntajes.importar);

// Inscripciones de último momento
router.get('/colegios', requiereClave, inscripcion.colegios);
router.get('/opciones', requiereClave, inscripcion.opciones);
router.post('/alumno', requiereClave, inscripcion.agregarAlumno);
router.post('/libre', requiereClave, inscripcion.agregarLibre);

export default router;
