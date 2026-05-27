import express from 'express';
import bodyParser from 'body-parser';

// 1. Importación de Rutas
import userRoutes from './routes/userRoutes.js';
import levelRoutes from './routes/levelRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

// 2. Importación del Webhook de Clerk
import { clerkWebhookHandler } from './controllers/webhookController.js';

const app = express();

// 3. Ruta del Webhook de Clerk 
// (IMPORTANTE: Debe ir antes de express.json() porque Svix necesita el body crudo/raw)
app.post(
    '/api/webhooks/clerk', 
    bodyParser.raw({ type: 'application/json' }), 
    clerkWebhookHandler
);

// 4. Middlewares globales
app.use(express.json()); // Permite a la API entender JSON en el resto de las rutas

// 5. Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/voice', voiceRoutes);

export default app;