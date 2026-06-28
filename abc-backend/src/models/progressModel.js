/**
 * @module models/Progress
 * @description Modelo de Progreso del Usuario para MongoDB.
 * 
 * Relaciona cada usuario con los niveles que ha desbloqueado,
 * está cursando o completó. Mantiene el puntaje más alto logrado
 * en cada nivel (nunca se reduce).
 */
import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  // Referencia al usuario dueño del progreso
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Referencia al nivel asociado
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  // Estado actual del nivel para este usuario
  status: {
    type: String,
    enum: ['locked', 'in_progress', 'completed'],
    default: 'in_progress'
  },
  // Puntaje más alto obtenido en este nivel
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  // Fecha en que se completó el nivel (null si no se completó aún)
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índice compuesto único: un usuario solo tiene un registro por nivel
progressSchema.index({ userId: 1, levelId: 1 }, { unique: true });

// ─── Métodos Estáticos ────────────────────────────────────────────

/**
 * Obtiene todo el progreso de un usuario buscando por su Clerk ID.
 * Primero resuelve el usuario interno y luego busca su progreso.
 * @param {string} clerkId - ID de Clerk Auth del usuario.
 * @returns {Promise<Array>} Lista de progresos del usuario.
 */
progressSchema.statics.findByUserClerkId = async function (clerkId) {
  // Importación dinámica para evitar dependencia circular
  const User = mongoose.model('User');
  const user = await User.findOne({ clerkId });
  if (!user) return [];

  return this.find({ userId: user._id })
    .select('levelId status score completedAt');
};

/**
 * Inserta o actualiza el progreso de un usuario en un nivel específico.
 * Si ya existe, conserva el puntaje más alto y no sobreescribe completedAt.
 * @param {string} clerkId - ID de Clerk Auth del usuario.
 * @param {string} levelId - ObjectId del nivel.
 * @param {string} status - Estado nuevo ('locked', 'in_progress', 'completed').
 * @param {number} score - Puntaje obtenido en esta sesión.
 * @returns {Promise<Object>} El progreso actualizado.
 */
progressSchema.statics.upsertProgress = async function (clerkId, levelId, status, score) {
  const User = mongoose.model('User');
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('Usuario no encontrado');

  // Buscamos progreso existente para respetar el puntaje más alto
  const existing = await this.findOne({ userId: user._id, levelId });

  const updateData = {
    status,
    score: existing ? Math.max(existing.score, score) : score
  };

  // Solo marcamos completedAt si pasa a 'completed' y no estaba completado antes
  if (status === 'completed' && (!existing || !existing.completedAt)) {
    updateData.completedAt = new Date();
  }

  return this.findOneAndUpdate(
    { userId: user._id, levelId },
    { $set: updateData },
    { new: true, upsert: true, select: 'levelId status score completedAt' }
  );
};

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;