/**
 * @module models/Content
 * @description Modelo del Diccionario de Contenido para MongoDB.
 * 
 * Almacena las palabras, sílabas e imágenes asociadas a cada nivel.
 * Las sílabas se guardan como array de strings para facilitar
 * la manipulación en el frontend (ej: ["ma", "ri", "po", "sa"]).
 */
import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  // Referencia al nivel al que pertenece este contenido
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
    index: true
  },
  // La palabra completa (ej: "mariposa")
  word: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Sílabas separadas como array (ej: ["ma", "ri", "po", "sa"])
  syllables: {
    type: [String],
    default: []
  },
  // URL de la imagen que aparece al acertar la palabra
  imageUrl: {
    type: String,
    default: null
  },
  // URL de audio pregrabado (opcional, para variaciones vocálicas)
  audioUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// ─── Métodos Estáticos ────────────────────────────────────────────

/**
 * Obtiene todo el diccionario de un nivel específico.
 * @param {string} levelId - ObjectId del nivel.
 * @returns {Promise<Array>} Lista de palabras con sus sílabas e imágenes.
 */
contentSchema.statics.getDictionaryByLevel = function (levelId) {
  return this.find({ levelId })
    .select('word syllables imageUrl audioUrl');
};

const Content = mongoose.model('Content', contentSchema);
export default Content;