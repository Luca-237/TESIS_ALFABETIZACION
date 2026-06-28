/**
 * @module controllers/webhookController
 * @description Controlador del Webhook de Clerk Auth.
 * 
 * Recibe y verifica los eventos de Clerk (registro de usuarios, etc.)
 * mediante la firma criptográfica de Svix. Al recibir un evento
 * 'user.created', sincroniza los datos del usuario en MongoDB.
 */
import { Webhook } from 'svix';
import User from '../models/userModel.js';

/**
 * POST /api/webhooks/clerk
 * Procesa los eventos enviados por Clerk Auth via webhook.
 * 
 * Flujo:
 * 1. Verifica las cabeceras de firma de Svix.
 * 2. Valida la autenticidad del payload.
 * 3. Si es un evento 'user.created', guarda el usuario en MongoDB.
 */
export const clerkWebhookHandler = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Por favor agrega CLERK_WEBHOOK_SECRET en tu archivo .env');
  }

  // Obtenemos las cabeceras de verificación que envía Svix
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Faltan cabeceras de Svix' });
  }

  // Preparamos el payload y las cabeceras para la verificación
  const payload = req.body.toString();
  const headers = {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  };

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    // Verificamos que el payload es auténtico y no fue manipulado
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error('❌ Error verificando webhook de Clerk:', err.message);
    return res.status(400).json({ error: 'Firma de webhook inválida' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`📩 Webhook recibido: ${eventType} para el usuario ${id}`);

  // Evento: usuario creado en Clerk → sincronizamos en MongoDB
  if (eventType === 'user.created') {
    const { id: clerkId, email_addresses, first_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = first_name || 'Usuario';

    try {
      await User.create({
        clerkId,
        name,
        email,
        profileImageUrl: image_url
      });
      console.log('✅ Usuario creado exitosamente en MongoDB');
    } catch (error) {
      console.error('❌ Error guardando usuario en MongoDB:', error);
      return res.status(500).json({ error: 'Error interno de base de datos' });
    }
  }

  // TODO: Manejar 'user.updated' y 'user.deleted' en el futuro

  return res.status(200).json({ success: true });
};