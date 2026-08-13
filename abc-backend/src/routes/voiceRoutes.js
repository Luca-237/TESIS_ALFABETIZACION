/**
 * @module routes/voiceRoutes
 * @description Rutas del motor de voz (STT y TTS).
 * 
 * Endpoints protegidos:
 * - POST  /api/voice/listen  → Enviar audio del micrófono para transcribir
 * - POST  /api/voice/speak   → Enviar texto para generar audio hablado
 */
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { generateSpeech } from '../controllers/voiceController.js';

const router = Router();

// Todas las rutas de voz requieren autenticación
router.use(authMiddleware);

// TTS: Recibe texto y devuelve audio MP3
router.post('/speak', generateSpeech);

export default router;