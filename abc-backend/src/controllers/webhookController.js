import { Webhook } from 'svix';
import UserModel from '../models/userModel.js';

export const clerkWebhookHandler = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Por favor agrega CLERK_WEBHOOK_SECRET en tu archivo .env');
    }

    // Obtener las cabeceras que envía Svix para verificar la firma
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Faltan cabeceras de Svix' });
    }

    // Obtener el body crudo (raw) necesario para Svix
    const payload = req.body.toString();
    const headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
    };

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
        // Verificamos que el payload es auténtico
        evt = wh.verify(payload, headers);
    } catch (err) {
        console.error('Error verificando el webhook de Clerk:', err.message);
        return res.status(400).json({ error: 'Firma de webhook inválida' });
    }

    const { id } = evt.data; // Este es el clerk_id
    const eventType = evt.type;

    console.log(`Webhook recibido: ${eventType} para el usuario ${id}`);

    // Si el evento es "user.created", guardamos los datos en PostgreSQL
    if (eventType === 'user.created') {
        const { id: clerkId, email_addresses, first_name, image_url } = evt.data;
        
        const email = email_addresses[0]?.email_address;
        const name = first_name || 'Usuario';
        
        try {
            await UserModel.create(clerkId, name, email, image_url);
            console.log('Usuario creado exitosamente en PostgreSQL');
        } catch (error) {
            console.error('Error guardando usuario en la base de datos:', error);
            return res.status(500).json({ error: 'Error interno de base de datos' });
        }
    }

    // Puedes manejar 'user.updated' o 'user.deleted' aquí en el futuro

    return res.status(200).json({ success: true });
};