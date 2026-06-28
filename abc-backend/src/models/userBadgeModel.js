/**
 * @module models/UserBadge
 * @description Modelo de Insignias del Usuario para MongoDB.
 * 
 * Registra qué insignias ha ganado cada usuario y cuándo las obtuvo.
 * Un usuario solo puede tener cada insignia una vez (índice único compuesto).
 */
import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema({
  // Referencia al usuario que ganó la insignia
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Referencia a la insignia obtenida
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  // Fecha en que se otorgó la insignia
  earnedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Un usuario solo puede tener cada insignia una vez
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);
export default UserBadge;
