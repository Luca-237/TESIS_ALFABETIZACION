/**
 * @module routes/voiceRoutes
 * @description Rutas del motor de voz (STT y TTS).
 * 
 * Endpoints protegidos:
 * - POST  /api/voice/listen  → Enviar audio del micrófono para transcribir
 * - POST  /api/voice/speak   → Enviar texto para generar audio hablado
 */
import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/authMiddleware.js';
import { processSpeech, generateSpeech } from '../controllers/voiceController.js';

const router = Router();

// Multer guarda los audios temporalmente en disco (se eliminan tras procesar)
const upload = multer({ dest: 'uploads/' });

// Todas las rutas de voz requieren autenticación
router.use(authMiddleware);

// STT: Recibe audio del micrófono del frontend
router.post('/listen', upload.single('audio'), processSpeech);

// TTS: Recibe texto y devuelve audio MP3
router.post('/speak', generateSpeech);

export default router;