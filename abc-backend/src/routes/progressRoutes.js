import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getUserProgress, updateProgress } from '../controllers/progressController.js';

const router = Router();

router.use(requireAuth());

router.get('/', getUserProgress);
router.put('/:levelId', updateProgress); // Usamos PUT porque actualiza o inserta si no existe

export default router;