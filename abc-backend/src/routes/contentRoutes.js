import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getDictionary } from '../controllers/contentController.js';

const router = Router();
router.use(requireAuth());

router.get('/dictionary/:levelId', getDictionary);

export default router;