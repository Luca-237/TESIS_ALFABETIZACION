import ProgressModel from '../models/progressModel.js';

export const getUserProgress = async (req, res) => {
    try {
        const clerkId = req.auth.userId; // Extraído del token de Clerk
        const progress = await ProgressModel.findByUserClerkId(clerkId);
        res.status(200).json({ data: progress });
    } catch (error) {
        console.error("Error obteniendo progreso:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const { levelId } = req.params;
        const { status, score } = req.body;

        // Validaciones básicas
        if (!['locked', 'in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Estado de progreso inválido' });
        }

        const updatedProgress = await ProgressModel.upsertProgress(clerkId, levelId, status, score || 0);
        
        res.status(200).json({ 
            message: 'Progreso actualizado exitosamente',
            data: updatedProgress 
        });
    } catch (error) {
        console.error("Error actualizando progreso:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};