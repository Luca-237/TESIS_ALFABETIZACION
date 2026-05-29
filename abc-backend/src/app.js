import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // <-- 1. Importamos cors

// Importación de Rutas
import userRoutes from './routes/userRoutes.js';
import levelRoutes from './routes/levelRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

// Importación del Webhook de Clerk
import { clerkWebhookHandler } from './controllers/webhookController.js';

const app = express();

// 2. Habilitamos CORS para que el frontend (Vite) pueda comunicarse
app.use(cors({
    origin: 'http://localhost:5173', // El puerto donde corre tu frontend
    credentials: true
}));

// Ruta del Webhook de Clerk (Debe ir antes de express.json())
app.post(
    '/api/webhooks/clerk', 
    bodyParser.raw({ type: 'application/json' }), 
    clerkWebhookHandler
);

// Middlewares globales
app.use(express.json());

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/voice', voiceRoutes);

export default app;