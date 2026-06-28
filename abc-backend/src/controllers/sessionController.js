/**
 * @module controllers/sessionController
 * @description Controlador de Sesiones de Práctica.
 * 
 * Registra las sesiones de práctica del niño y actualiza
 * sus puntos totales en el "registro maestro" de forma atómica.
 */
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';

/**
 * POST /api/sessions
 * Crea una nueva sesión de práctica y suma los puntos al usuario.
 * Ambas operaciones se ejecutan dentro de una transacción MongoDB.
 */
export const createSession = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { duration, correctWords, incorrectWords, isDiagnostic, pointsEarned } = req.body;

    // Obtenemos el ObjectId interno del usuario desde su Clerk ID
    const user = await User.findByClerkId(clerkId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const newSession = await Session.saveSessionAndUpdatePoints(
      user._id,
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
    console.error('❌ Error registrando sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};