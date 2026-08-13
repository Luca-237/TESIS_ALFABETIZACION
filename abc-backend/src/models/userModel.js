/**
 * @module models/User
 * @description Modelo de Usuario para MongoDB.
 * 
 * Almacena los datos del perfil sincronizados desde Clerk Auth,
 * junto con los puntos acumulados y la preferencia de tema visual.
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // ID único de Clerk Auth — vincula el usuario externo con la DB local
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  // Puntos totales acumulados en el "registro maestro" del jugador
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  // Preferencia visual: modo claro u oscuro
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  // Cola de Repetición Espaciada para registrar palabras falladas
  spacedRepetitionQueue: [{
    word: { type: String, required: true },
    syllable: { type: String, required: true },
    errorCount: { type: Number, default: 1 },
    weight: { type: Number, default: 2 },
    lastFailed: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true  // Agrega createdAt y updatedAt automáticamente
});

// ─── Métodos Estáticos ────────────────────────────────────────────

/**
 * Busca un usuario por su Clerk ID.
 * @param {string} clerkId - ID del usuario en Clerk Auth.
 * @returns {Promise<Object|null>} El usuario encontrado o null.
 */
userSchema.statics.findByClerkId = function (clerkId) {
  return this.findOne({ clerkId })
    .select('name email totalPoints themePreference profileImageUrl');
};

/**
 * Actualiza la preferencia de tema (light/dark) de un usuario.
 * @param {string} userId - ObjectId del usuario en MongoDB.
 * @param {string} theme - 'light' o 'dark'.
 * @returns {Promise<Object|null>} El usuario actualizado.
 */
userSchema.statics.updateThemePreference = function (userId, theme) {
  return this.findByIdAndUpdate(
    userId,
    { themePreference: theme },
    { new: true, select: 'themePreference' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;