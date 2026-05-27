import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getLevels, getLevel } from '../controllers/levelController.js';

const router = Router();

router.use(requireAuth()); // Protegemos las rutas para que solo niños logueados vean los niveles

router.get('/', getLevels);
router.get('/:id', getLevel);

export default router;