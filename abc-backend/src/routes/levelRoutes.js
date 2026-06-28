/**
 * @module routes/levelRoutes
 * @description Rutas de consulta de niveles.
 * 
 * Endpoints protegidos:
 * - GET  /api/levels      → Listar todos los niveles (mapa de progresión)
 * - GET  /api/levels/:id  → Obtener detalle de un nivel
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getLevels, getLevel } from '../controllers/levelController.js';

const router = Router();

// Solo usuarios autenticados pueden ver los niveles
router.use(authMiddleware);

router.get('/', getLevels);
router.get('/:id', getLevel);

export default router;