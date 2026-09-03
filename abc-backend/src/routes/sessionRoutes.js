/**
 * @module routes/sessionRoutes
 * @description Rutas de sesiones de práctica.
 *
 * Endpoints protegidos:
 *  POST /api/sessions              → Registrar sesión simple (legacy)
 *  POST /api/sessions/end-session  → Fin de sesión completo (SR + gate + XP)
 *  GET  /api/sessions/warmup       → Obtener ítems SR para el warm-up inicial
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  createSession,
  endSession,
  getWarmupItems,
} from '../controllers/sessionController.js';

const router = Router();

router.use(authMiddleware);

// ── Rutas ──────────────────────────────────────────────────────────
router.post('/', createSession);
router.post('/end-session', endSession);
router.get('/warmup', getWarmupItems);

export default router;