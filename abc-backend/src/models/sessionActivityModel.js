/**
 * @module models/SessionActivity
 * @description Modelo de Registro de Actividades por Sesión para MongoDB.
 * 
 * Guarda el detalle granular de qué hizo el niño en cada sesión:
 * qué actividad realizó, en qué nivel, cuántas palabras intentó
 * y cuántas acertó (para disparar las recompensas visuales).
 */
import mongoose from 'mongoose';

const sessionActivitySchema = new mongoose.Schema({
  // Referencia a la sesión padre
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  // Referencia al minijuego realizado
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  // Referencia al nivel en el que se realizó la actividad
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    default: null
  },
  // Palabras que el niño intentó leer/escribir
  wordsAttempted: {
    type: Number,
    default: 0,
    min: 0
  },
  // Palabras acertadas (disparan imágenes/recompensas)
  wordsHit: {
    type: Number,
    default: 0,
    min: 0
  },
  // Puntos ganados en esta actividad específica
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

const SessionActivity = mongoose.model('SessionActivity', sessionActivitySchema);
export default SessionActivity;
