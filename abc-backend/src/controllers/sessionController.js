import SessionModel from '../models/sessionModel.js';
import UserModel from '../models/userModel.js';

export const createSession = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const { duration, correctWords, incorrectWords, isDiagnostic, pointsEarned } = req.body;

        // Necesitamos el UUID interno del usuario
        const user = await UserModel.findByClerkId(clerkId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const newSession = await SessionModel.saveSessionAndUpdatePoints(
            user.id, 
            duration, 
            correctWords, 
            incorrectWords, 
            isDiagnostic, 
            pointsEarned || 0
        );

        res.status(201).json({ 
            message: 'Sesión registrada con éxito', 
            data: newSession 
        });
    } catch (error) {
        console.error("Error registrando sesión:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};