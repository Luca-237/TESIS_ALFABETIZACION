/**
 * @module models/Session
 * @description Modelo de Sesiones para MongoDB.
 * 
 * Registra cada sesión de práctica del niño con sus estadísticas.
 * Al guardar una sesión, también actualiza los puntos totales del usuario
 * de forma atómica usando una transacción de MongoDB.
 */
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  // Referencia al usuario que realizó la sesión
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Fecha y hora en que se realizó la sesión
  sessionDate: {
    type: Date,
    default: Date.now
  },
  // Duración total de la sesión en segundos
  durationSeconds: {
    type: Number,
    default: 0,
    min: 0
  },
  // Cantidad de palabras acertadas
  correctWords: {
    type: Number,
    default: 0,
    min: 0
  },
  // Cantidad de palabras falladas
  incorrectWords: {
    type: Number,
    default: 0,
    min: 0
  },
  // Nivel principal de esta sesión (opcional)
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level'
  },
  // Sub-nivel específico de esta sesión (opcional)
  subLevelId: {
    type: String
  },
  // Energía restante al final de la sesión
  fitoCookies: {
    type: Number,
    default: 5,
    min: 0
  },
  // Veces que se activó el minijuego de descanso para evitar frustración
  frustrationMinigamesTriggered: {
    type: Number,
    default: 0,
    min: 0
  },
  // Indica si esta sesión fue el test diagnóstico inicial
  isDiagnosticTest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ─── Métodos Estáticos ────────────────────────────────────────────

/**
 * Guarda una sesión y actualiza los puntos totales del usuario.
 * Usa una transacción de MongoDB para garantizar consistencia:
 * si falla la actualización de puntos, se revierte la sesión.
 * 
 * @param {string} userId - ObjectId del usuario.
 * @param {number} duration - Duración en segundos.
 * @param {number} correctWords - Palabras acertadas.
 * @param {number} incorrectWords - Palabras falladas.
 * @param {boolean} isDiagnostic - Si es test diagnóstico.
 * @param {number} pointsEarned - Puntos ganados en la sesión.
 * @param {Object} gamificationData - Objeto con { fitoCookies, frustrationMinigamesTriggered, levelId, subLevelId }.
 * @returns {Promise<Object>} La sesión creada.
 */
sessionSchema.statics.saveSessionAndUpdatePoints = async function (
  userId, duration, correctWords, incorrectWords, isDiagnostic, pointsEarned, gamificationData = {}
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Creamos la sesión de práctica
    const [newSession] = await this.create([{
      userId,
      durationSeconds: duration,
      correctWords,
      incorrectWords,
      isDiagnosticTest: isDiagnostic,
      levelId: gamificationData.levelId,
      subLevelId: gamificationData.subLevelId,
      fitoCookies: gamificationData.fitoCookies ?? 5,
      frustrationMinigamesTriggered: gamificationData.frustrationMinigamesTriggered ?? 0
    }], { session });

    // 2. Sumamos los puntos al registro maestro del usuario
    if (pointsEarned > 0) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(
        userId,
        { $inc: { totalPoints: pointsEarned } },
        { session }
      );
    }

    // Confirmamos ambas operaciones
    await session.commitTransaction();
    return newSession;

  } catch (error) {
    // Si algo falla, revertimos todo
    await session.abortTransaction();
    console.error('❌ Error en transacción de sesión:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

const Session = mongoose.model('Session', sessionSchema);
export default Session;