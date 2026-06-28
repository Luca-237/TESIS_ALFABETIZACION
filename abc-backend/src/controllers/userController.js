/**
 * @module controllers/userController
 * @description Controlador de Usuarios.
 * 
 * Maneja las operaciones del perfil del usuario autenticado:
 * - Obtener los datos del perfil
 * - Cambiar la preferencia de tema (claro/oscuro)
 */
import User from '../models/userModel.js';

/**
 * GET /api/users/profile
 * Obtiene el perfil del usuario actualmente autenticado.
 * El clerkId viene del middleware de autenticación (Clerk o mock).
 */
export const getUserProfile = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const user = await User.findByClerkId(clerkId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/users/theme
 * Actualiza la preferencia de tema visual del usuario.
 * Solo acepta los valores 'light' o 'dark'.
 */
export const updateTheme = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { theme } = req.body;

    // Validación: solo aceptamos light o dark
    if (theme !== 'light' && theme !== 'dark') {
      return res.status(400).json({ error: 'El tema debe ser "light" o "dark"' });
    }

    const user = await User.findByClerkId(clerkId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updatedUser = await User.updateThemePreference(user._id, theme);
    res.status(200).json({ data: updatedUser, message: 'Tema actualizado' });
  } catch (error) {
    console.error('❌ Error actualizando tema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};