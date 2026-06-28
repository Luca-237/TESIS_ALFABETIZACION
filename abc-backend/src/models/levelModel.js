/**
 * @module models/Level
 * @description Modelo de Niveles para MongoDB.
 * 
 * Define la currícula pedagógica del sistema, desde sílabas básicas
 * hasta cuentos ilustrados. Cada nivel tiene un orden de progresión
 * y puede ser marcado como test diagnóstico.
 */
import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  // Orden secuencial del nivel (1: Sílabas, 2: Palabras, etc.)
  levelOrder: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // Indica si este nivel funciona como evaluación diagnóstica inicial
  isDiagnostic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ─── Métodos Estáticos ────────────────────────────────────────────

/**
 * Obtiene todos los niveles ordenados por su secuencia.
 * Se usa para mostrar el "Mapa de Niveles" en el frontend.
 * @returns {Promise<Array>} Lista de niveles ordenados.
 */
levelSchema.statics.findAllOrdered = function () {
  return this.find()
    .sort({ levelOrder: 1 })
    .select('levelOrder title description isDiagnostic');
};

const Level = mongoose.model('Level', levelSchema);
export default Level;