/**
 * @module controllers/sessionController
 * @description Controlador de Sesiones de Práctica.
 *
 * Registra las sesiones de práctica del niño y actualiza
 * sus puntos totales en el "registro maestro" de forma atómica.
 *
 * Endpoints:
 *  POST /api/sessions            → Registro simple de sesión (legacy)
 *  POST /api/sessions/end-session → Fin de sesión completo con gating y SR
 *  GET  /api/sessions/warmup      → Obtener ítems SR para el warm-up
 */
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';
import { processEndOfSession } from '../services/progressionService.js';
import { selectWarmupItems } from '../services/spacedRepetitionService.js';

/**
 * POST /api/sessions
 * Crea una nueva sesión de práctica y suma los puntos al usuario.
 * Ambas operaciones se ejecutan dentro de una transacción MongoDB.
 * @deprecated Usar /end-session para la lógica completa de progresión.
 */
export const createSession = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { duration, correctWords, incorrectWords, isDiagnostic, pointsEarned } = req.body;

    // Obtenemos el ObjectId interno del usuario desde su Clerk ID
    const user = await User.findByClerkId(clerkId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const newSession = await Session.saveSessionAndUpdatePoints(
      user._id,
      duration,
      correctWords,
      incorrectWords,
      isDiagnostic,
      pointsEarned || 0
    );

    res.status(201).json({
      message: 'Sesión registrada con éxito',
      data: newSession
    });
  } catch (error) {
    console.error('❌ Error registrando sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * POST /api/sessions/end-session
 * Procesa el fin de sesión completo:
 *  1. Actualiza la cola de Repetición Espaciada (palabras falladas / warm-up)
 *  2. Evalúa el Gate para avanzar de sub-nivel o nivel
 *  3. Guarda la sesión y suma XP al usuario (transacción atómica)
 *  4. Devuelve el resultado del gate y el XP ganado
 *
 * Body esperado:
 * {
 *   "durationSeconds": 842,
 *   "levelId": "ObjectId",
 *   "subLevelId": "A",
 *   "correctWords": 6,
 *   "incorrectWords": 2,
 *   "rachaAciertosMaxima": 4,
 *   "rachaAciertosActual": 2,
 *   "fitoCookies": 3,
 *   "frustrationMinigamesTriggered": 1,
 *   "isDiagnostic": false,
 *   "palabrasFalladas": [{ "word": "mesa", "syllable": "me" }],
 *   "srItemsPracticados": [{ "word": "mapa", "syllable": "ma", "resultado": "correcto" }]
 * }
 */
export const endSession = async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    const {
      durationSeconds,
      levelId,
      subLevelId,
      correctWords,
      incorrectWords,
      rachaAciertosMaxima,
      rachaAciertosActual,
      fitoCookies,
      frustrationMinigamesTriggered,
      isDiagnostic,
      palabrasFalladas,
      srItemsPracticados,
    } = req.body;

    // ── Validaciones básicas ───────────────────────────────────────
    if (!levelId || !subLevelId) {
      return res.status(400).json({ error: 'levelId y subLevelId son obligatorios' });
    }
    if (typeof correctWords !== 'number' || typeof incorrectWords !== 'number') {
      return res.status(400).json({ error: 'correctWords e incorrectWords deben ser números' });
    }
    if (!['A', 'B', 'C'].includes(subLevelId)) {
      return res.status(400).json({ error: 'subLevelId debe ser A, B o C' });
    }

    // ── Resolver usuario ───────────────────────────────────────────
    const user = await User.findByClerkId(clerkId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // ── 1. Lógica de progresión (SR + Gate + cálculo de XP) ────────
    const { xpGanado, gateStatus } = await processEndOfSession(
      user._id,
      clerkId,
      {
        levelId,
        subLevelId,
        correctWords,
        incorrectWords,
        rachaAciertosMaxima: rachaAciertosMaxima || 0,
        rachaAciertosActual: rachaAciertosActual || 0,
        palabrasFalladas: palabrasFalladas || [],
        srItemsPracticados: srItemsPracticados || [],
      }
    );

    // ── 2. Guardar sesión y sumar XP al usuario (transacción) ──────
    const savedSession = await Session.saveSessionAndUpdatePoints(
      user._id,
      durationSeconds || 0,
      correctWords,
      incorrectWords,
      isDiagnostic || false,
      xpGanado,
      {
        levelId,
        subLevelId,
        fitoCookies: fitoCookies ?? 5,
        frustrationMinigamesTriggered: frustrationMinigamesTriggered || 0,
      }
    );

    // ── 3. Respuesta ───────────────────────────────────────────────
    res.status(201).json({
      message: 'Sesión guardada exitosamente',
      xpGanado,
      gateStatus,
      data: savedSession,
    });

  } catch (error) {
    console.error('❌ Error en end-session:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/sessions/warmup
 * Devuelve los top-3 ítems de la cola de Repetición Espaciada
 * para usar en el calentamiento al inicio de la sesión.
 *
 * Respuesta:
 * {
 *   "warmupItems": [
 *     { "word": "mesa", "syllable": "me", "errorCount": 3, "weight": 4 },
 *     ...
 *   ]
 * }
 */
export const getWarmupItems = async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    const user = await User.findOne({ clerkId })
      .select('spacedRepetitionQueue');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const warmupItems = selectWarmupItems(user.spacedRepetitionQueue);

    res.status(200).json({
      warmupItems,
      totalEnCola: user.spacedRepetitionQueue.length,
    });

  } catch (error) {
    console.error('❌ Error obteniendo warm-up items:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};