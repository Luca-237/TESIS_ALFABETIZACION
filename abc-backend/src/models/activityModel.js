/**
 * @module models/Activity
 * @description Modelo de Actividades / Minijuegos para MongoDB.
 * 
 * Catálogo de los minijuegos disponibles en la plataforma:
 * Ruleta con letras, Abrecajas, Une las parejas, y lectura.
 */
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  // Nombre visible del minijuego (ej: "Ruleta de Letras")
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Tipo técnico del minijuego para lógica del frontend
  activityType: {
    type: String,
    required: true,
    enum: ['roulette', 'matching', 'reading', 'box_opening', 'ordering'],
    trim: true
  }
}, {
  timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
