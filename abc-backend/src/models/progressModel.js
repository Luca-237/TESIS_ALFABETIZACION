/**
 * @module models/Progress
 * @description Modelo de Progreso del Usuario para MongoDB.
 *
 * Relaciona cada usuario con los niveles que ha desbloqueado,
 * está cursando o completó. Mantiene el puntaje más alto logrado
 * en cada nivel (nunca se reduce).
 *
 * Campos de Gating (agregados para el sistema de progresión algorítmica):
 *  - subLevelId: sub-nivel actual del niño en este nivel ('A', 'B' o 'C')
 *  - rachaAciertos: racha de aciertos consecutivos más alta registrada
 *  - sesionesEnSubC: cantidad de sesiones completadas en el sub-nivel C
 *    (se necesitan >= 2 para activar el gate principal al siguiente nivel)
 *  - precisionAcumuladaSubC: promedio de precisión en el sub-nivel C
 *    (debe ser >= 80% para activar el gate principal)
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
  // Sub-nivel pedagógico actual dentro del nivel ('A', 'B' o 'C')
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
  // Racha de aciertos consecutivos más alta registrada
  highestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  // ── Campos de Gating ──────────────────────────────────────────
  // Racha de aciertos consecutivos actual (se resetea al fallar)
  rachaAciertos: {
    type: Number,
    default: 0,
    min: 0
  },
  // Sesiones completadas en el sub-nivel C (gate requiere >= 2)
  sesionesEnSubC: {
    type: Number,
    default: 0,
    min: 0
  },
  // Precisión promedio acumulada en el sub-nivel C (gate requiere >= 0.80)
  precisionAcumuladaSubC: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
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
 * Conserva siempre los récords históricos (highestStreak, accuracyPercentage).
 *
 * @param {string} clerkId              - Clerk ID del usuario.
 * @param {string} levelId              - ObjectId del nivel.
 * @param {string} subLevelId           - Sub-nivel del que viene el niño (el actual antes del gate).
 * @param {string} nuevoSubNivel        - Sub-nivel resultante después de evaluar el gate.
 * @param {string} status               - 'in_progress' | 'completed'.
 * @param {number} score                - XP ganado en esta sesión.
 * @param {number} accuracy             - Precisión de la sesión (0-100).
 * @param {number} streak               - Racha de aciertos de la sesión.
 * @param {number} sesionesEnSubC       - Sesiones completadas en sub-nivel C.
 * @param {number} precisionAcumuladaC  - Precisión promedio acumulada en sub-C (0-1).
 */
progressSchema.statics.upsertProgress = async function (
  clerkId, levelId, subLevelId, nuevoSubNivel, status,
  score, accuracy, streak,
  sesionesEnSubC = 0, precisionAcumuladaC = 0
) {
  const User = mongoose.model('User');
  const user = await User.findOne({ clerkId });
  if (!user) throw new Error('Usuario no encontrado');

  const existing = await this.findOne({ userId: user._id, levelId, subLevelId });

  const updateData = {
    subLevelId: nuevoSubNivel,           // Actualizar al sub-nivel resultante del gate
    status,
    score: existing ? Math.max(existing.score, score || 0) : (score || 0),
    accuracyPercentage: existing
      ? Math.max(existing.accuracyPercentage, accuracy || 0)
      : (accuracy || 0),
    highestStreak: existing
      ? Math.max(existing.highestStreak, streak || 0)
      : (streak || 0),
    // Campos de gating (siempre se actualizan con el valor más reciente)
    rachaAciertos: streak || 0,
    sesionesEnSubC,
    precisionAcumuladaSubC: precisionAcumuladaC,
  };

  if (status === 'completed' && (!existing || !existing.completedAt)) {
    updateData.completedAt = new Date();
  }

  return this.findOneAndUpdate(
    { userId: user._id, levelId, subLevelId },
    { $set: updateData },
    {
      new: true,
      upsert: true,
      select: 'levelId subLevelId status score accuracyPercentage highestStreak rachaAciertos sesionesEnSubC precisionAcumuladaSubC completedAt'
    }
  );
};

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;