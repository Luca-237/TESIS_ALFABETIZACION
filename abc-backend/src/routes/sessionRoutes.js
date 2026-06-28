/**
 * @module routes/sessionRoutes
 * @description Rutas de sesiones de práctica.
 * 
 * Endpoints protegidos:
 * - POST  /api/sessions  → Registrar una nueva sesión con estadísticas
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createSession } from '../controllers/sessionController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createSession);

export default router;