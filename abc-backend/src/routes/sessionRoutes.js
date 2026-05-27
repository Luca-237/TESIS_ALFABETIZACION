import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { createSession } from '../controllers/sessionController.js';

const router = Router();
router.use(requireAuth());

router.post('/', createSession);

export default router;