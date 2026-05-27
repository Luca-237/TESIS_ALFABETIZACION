import UserModel from '../models/userModel.js';

// GET: Obtener perfil del usuario
export const getUserProfile = async (req, res) => {
    try {
        // req.auth viene del middleware de Clerk, contiene el ID del usuario logueado
        const clerkId = req.auth.userId; 
        
        const user = await UserModel.findByClerkId(clerkId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos local' });
        }
        
        res.status(200).json({ data: user });
    } catch (error) {
        console.error("Error obteniendo perfil:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// PUT: Actualizar preferencia de tema (claro/oscuro)
export const updateTheme = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const { theme } = req.body;

        if (theme !== 'light' && theme !== 'dark') {
            return res.status(400).json({ error: 'El tema debe ser light o dark' });
        }

        const user = await UserModel.findByClerkId(clerkId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const updatedUser = await UserModel.updateThemePreference(user.id, theme);
        res.status(200).json({ data: updatedUser, message: 'Tema actualizado' });
    } catch (error) {
        console.error("Error actualizando tema:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};