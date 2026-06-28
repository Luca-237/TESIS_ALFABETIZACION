/**
 * @module routes/contentRoutes
 * @description Rutas del diccionario de contenido pedagógico.
 * 
 * Endpoints protegidos:
 * - GET  /api/content/dictionary/:levelId  → Obtener palabras de un nivel
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getDictionary } from '../controllers/contentController.js';

const router = Router();

router.use(authMiddleware);

router.get('/dictionary/:levelId', getDictionary);

export default router;