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
  // Nivel principal (ej. Nivel 1)
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  // Sub-nivel específico (ej. "1-2" o "3-1")
  subLevelId: {
    type: String,
    required: true
  },
  // Estado actual del sub-nivel para este usuario
  status: {
    type: String,
    enum: ['locked', 'in_progress', 'completed'],
    default: 'in_progress'
  },
  // Puntaje o experiencia ganada en este sub-nivel
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  // Precisión más alta obtenida (porcentaje 0-100)
  accuracyPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Racha de aciertos consecutivos más alta en este sub-nivel
  highestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  // Fecha en que se completó el sub-nivel (null si no se completó aún)
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índice compuesto único: un usuario solo tiene un registro por sub-nivel
progressSchema.index({ userId: 1, levelId: 1, subLevelId: 1 }, { unique: true });

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
    .select('levelId subLevelId status score accuracyPercentage highestStreak completedAt');
};

/**
 * Inserta o actualiza el progreso de un usuario en un sub-nivel.
 * Si ya existe, conserva los récords históricos (highestStreak, accuracy).
 */
progressSchema.statics.upsertProgress = async function (clerkId, levelId, subLevelId, status, score, accuracy, streak) {
  const User = mongoose.model('User');
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('Usuario no encontrado');

  const existing = await this.findOne({ userId: user._id, levelId, subLevelId });

  const updateData = {
    status,
    score: existing ? Math.max(existing.score, score) : score,
    accuracyPercentage: existing ? Math.max(existing.accuracyPercentage, accuracy || 0) : (accuracy || 0),
    highestStreak: existing ? Math.max(existing.highestStreak, streak || 0) : (streak || 0)
  };

  if (status === 'completed' && (!existing || !existing.completedAt)) {
    updateData.completedAt = new Date();
  }

  return this.findOneAndUpdate(
    { userId: user._id, levelId, subLevelId },
    { $set: updateData },
    { new: true, upsert: true, select: 'levelId subLevelId status score accuracyPercentage highestStreak completedAt' }
  );
};

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;