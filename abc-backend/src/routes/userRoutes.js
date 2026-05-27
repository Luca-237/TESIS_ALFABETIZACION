import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getUserProfile, updateTheme } from '../controllers/userController.js';

const router = Router();

// BYPASS TEMPORAL PARA PRUEBAS EN BRUNO:
const mockRequireAuth = () => {
    return (req, res, next) => {
        // Simulamos lo que haría Clerk si el token fuera válido
        req.auth = { userId: 'user_prueba_123' }; 
        next();
    };
};

// Todas las rutas aquí están protegidas. 
// Cuando quieras usar la autenticación real de Clerk, simplemente cambia 
// mockRequireAuth() por requireAuth()
router.use(mockRequireAuth());

router.get('/profile', getUserProfile);
router.put('/theme', updateTheme);

export default router;