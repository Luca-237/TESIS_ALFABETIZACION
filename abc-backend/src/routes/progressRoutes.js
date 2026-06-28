/**
 * @module routes/progressRoutes
 * @description Rutas de progreso del usuario.
 * 
 * Endpoints protegidos:
 * - GET  /api/progress            → Obtener todo el progreso del usuario
 * - PUT  /api/progress/:levelId   → Actualizar progreso en un nivel (upsert)
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getUserProgress, updateProgress } from '../controllers/progressController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getUserProgress);
router.put('/:levelId', updateProgress);

export default router;