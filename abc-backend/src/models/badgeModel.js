/**
 * @module models/Badge
 * @description Modelo de Insignias para MongoDB.
 * 
 * Define el catálogo de insignias de logros que los niños pueden
 * desbloquear. Cada insignia tiene una condición de activación
 * (ej: completar un nivel, acertar 100 palabras, etc.).
 */
import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  // Nombre de la insignia (ej: "Maestro de Sílabas")
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Descripción del logro para mostrar al niño
  description: {
    type: String,
    default: ''
  },
  // URL de la imagen/ícono de la insignia
  imageUrl: {
    type: String,
    required: true
  },
  // Tipo de condición que activa la insignia
  // Se evalúa programáticamente al cumplirse ciertos hitos
  conditionType: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
