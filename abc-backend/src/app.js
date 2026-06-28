/**
 * @module app
 * @description Configuración principal de la aplicación Express de FitoABC.
 * 
 * Define los middlewares globales, registra las rutas de la API
 * y configura CORS para la comunicación con el frontend de React.
 */
import express from 'express';
import cors from 'cors';

// ─── Importación de Rutas ─────────────────────────────────────────
import userRoutes from './routes/userRoutes.js';
import levelRoutes from './routes/levelRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

// ─── Webhook de Clerk Auth ────────────────────────────────────────
import { clerkWebhookHandler } from './controllers/webhookController.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────
// Permite que el frontend (Vite en dev, o la URL de producción) se comunique
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

// ─── Webhook (ANTES de express.json()) ────────────────────────────
// Clerk envía el payload como raw body; express.json() lo parsearía
// y rompería la verificación de firma de Svix.
app.post(
  '/api/webhooks/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhookHandler
);

// ─── Middlewares Globales ─────────────────────────────────────────
app.use(express.json());

// ─── Rutas de la API ──────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/voice', voiceRoutes);

export default app;