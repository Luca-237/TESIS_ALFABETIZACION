/**
 * @module services/spacedRepetitionService
 * @description Servicio de Repetición Espaciada para FitoABC.
 *
 * Gestiona la cola `spacedRepetitionQueue` del userModel usando
 * una variante simplificada del algoritmo SM-2 adaptada para niños de 6 años.
 * En lugar de intervalos en días, usa "peso" (weight) para priorizar
 * los ítems que más dificultad presentaron al niño.
 *
 * Reglas de peso:
 *  - weight 4-5 → aparece en warm-up cada sesión (error muy frecuente)
 *  - weight 3   → cada 2 sesiones
 *  - weight 2   → cada 3 sesiones
 *  - weight 1   → cada 5 sesiones (próximo a graduarse)
 *  - weight 0   → se elimina de la cola (¡graduado! ✅)
 */
import mongoose from 'mongoose';

/**
 * Registra un error en la cola de repetición espaciada.
 * Si el ítem ya existe, incrementa su weight y errorCount.
 * Si es nuevo, lo inserta con weight inicial de 2.
 *
 * @param {string} userId  - ObjectId del usuario.
 * @param {string} word    - Palabra fallada (ej: "mesa").
 * @param {string} syllable - Sílaba problemática (ej: "me").
 * @returns {Promise<void>}
 */
export async function updateQueueOnError(userId, word, syllable) {
  const User = mongoose.model('User');

  const user = await User.findById(userId).select('spacedRepetitionQueue');
  if (!user) throw new Error(`Usuario ${userId} no encontrado en SR`);

  const itemIndex = user.spacedRepetitionQueue.findIndex(i => i.word === word);

  if (itemIndex >= 0) {
    // ── Ya existe → incrementar peso y conteo de errores ──────────
    await User.findOneAndUpdate(
      { _id: userId, 'spacedRepetitionQueue.word': word },
      {
        $inc: {
          'spacedRepetitionQueue.$.errorCount': 1,
          'spacedRepetitionQueue.$.weight': 1,
        },
        $set: { 'spacedRepetitionQueue.$.lastFailed': new Date() },
      }
    );
  } else {
    // ── Primera vez que falla → agregar a la cola ─────────────────
    await User.findByIdAndUpdate(userId, {
      $push: {
        spacedRepetitionQueue: {
          word,
          syllable,
          errorCount: 1,
          weight: 2,
          lastFailed: new Date(),
        },
      },
    });
  }
}

/**
 * Registra un acierto sobre un ítem que estaba en la cola SR.
 * Reduce el weight en 1. Si llega a 0, elimina el ítem (graduado).
 * Si el ítem no está en la cola, no hace nada.
 *
 * @param {string} userId - ObjectId del usuario.
 * @param {string} word   - Palabra acertada.
 * @returns {Promise<void>}
 */
export async function updateQueueOnSuccess(userId, word) {
  const User = mongoose.model('User');

  const user = await User.findById(userId).select('spacedRepetitionQueue');
  if (!user) return;

  const item = user.spacedRepetitionQueue.find(i => i.word === word);
  if (!item) return; // No estaba en la cola, no hay nada que hacer

  if (item.weight <= 1) {
    // ── Dominio alcanzado → eliminar de la cola (graduado ✅) ─────
    await User.findByIdAndUpdate(userId, {
      $pull: { spacedRepetitionQueue: { word } },
    });
  } else {
    // ── Reducir peso (aún necesita práctica) ──────────────────────
    await User.findOneAndUpdate(
      { _id: userId, 'spacedRepetitionQueue.word': word },
      { $inc: { 'spacedRepetitionQueue.$.weight': -1 } }
    );
  }
}

/**
 * Procesa todos los ítems reportados al final de una sesión:
 * actualiza la cola SR según si cada ítem fue correcto o incorrecto.
 *
 * @param {string} userId           - ObjectId del usuario.
 * @param {Array}  palabrasFalladas - [{word, syllable}] falladas en la sesión.
 * @param {Array}  srItemsPracticados - [{word, syllable, resultado}] practicados en warm-up.
 * @returns {Promise<void>}
 */
export async function processBatchQueueUpdate(userId, palabrasFalladas = [], srItemsPracticados = []) {
  // 1. Registrar todos los errores de la sesión
  const errorPromises = palabrasFalladas.map(({ word, syllable }) =>
    updateQueueOnError(userId, word, syllable)
  );

  // 2. Actualizar ítems practicados en el warm-up
  const srPromises = srItemsPracticados.map(({ word, syllable, resultado }) => {
    if (resultado === 'correcto') {
      return updateQueueOnSuccess(userId, word);
    } else {
      return updateQueueOnError(userId, word, syllable);
    }
  });

  await Promise.all([...errorPromises, ...srPromises]);
}

/**
 * Selecciona los top-3 ítems de la cola para el warm-up de la sesión.
 * Ordena por: errorCount DESC → weight DESC → lastFailed DESC (más reciente).
 *
 * @param {Array} spacedRepetitionQueue - La cola del usuario.
 * @returns {Array} Hasta 3 ítems para el warm-up.
 */
export function selectWarmupItems(spacedRepetitionQueue = []) {
  return [...spacedRepetitionQueue]
    .sort((a, b) => {
      // Prioridad 1: Mayor errorCount (más difícil para el niño)
      if (b.errorCount !== a.errorCount) return b.errorCount - a.errorCount;
      // Prioridad 2: Mayor weight
      if (b.weight !== a.weight) return b.weight - a.weight;
      // Prioridad 3: Más reciente
      return new Date(b.lastFailed) - new Date(a.lastFailed);
    })
    .slice(0, 3);
}

/**
 * Selecciona ítems para el minijuego anti-frustración.
 * Usa solo ítems casi dominados (errorCount <= 1) para garantizar
 * que el niño tenga éxito y recupere confianza.
 *
 * @param {Array} spacedRepetitionQueue - La cola del usuario.
 * @returns {Array} Hasta 4 ítems fáciles.
 */
export function selectMinigameItems(spacedRepetitionQueue = []) {
  const easyItems = spacedRepetitionQueue.filter(item => item.errorCount <= 1);

  if (easyItems.length === 0) {
    // Si no hay ítems fáciles en cola, devolver los de menor weight
    return [...spacedRepetitionQueue]
      .sort((a, b) => a.weight - b.weight)
      .slice(0, 4);
  }

  // Shuffle para variedad y tomar 4
  return easyItems
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
}
