/**
 * @module routes/userRoutes
 * @description Rutas de gestión de usuarios.
 * 
 * Endpoints protegidos:
 * - GET  /api/users/profile  → Obtener perfil del usuario autenticado
 * - PUT  /api/users/theme    → Cambiar preferencia de tema
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getUserProfile, updateTheme } from '../controllers/userController.js';

const router = Router();

// Todas las rutas de usuario requieren autenticación
router.use(authMiddleware);

router.get('/profile', getUserProfile);
router.put('/theme', updateTheme);

export default router;