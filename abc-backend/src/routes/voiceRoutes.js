import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '@clerk/express';
import { processSpeech, generateSpeech } from '../controllers/voiceController.js';

const router = Router();
// Guardamos los audios temporalmente en la carpeta /tmp o en disco local
const upload = multer({ dest: 'uploads/' });

// BYPASS TEMPORAL PARA PRUEBAS EN BRUNO (Igual que en userRoutes):
const mockRequireAuth = () => {
    return (req, res, next) => {
        req.auth = { userId: 'user_prueba_123' }; 
        next();
    };
};

router.use(mockRequireAuth());

// POST /api/voice/listen -> Recibe el audio del micrófono del frontend
router.post('/listen', upload.single('audio'), processSpeech);

// POST /api/voice/speak -> Recibe texto y devuelve un archivo de audio MP3
router.post('/speak', generateSpeech);

export default router;