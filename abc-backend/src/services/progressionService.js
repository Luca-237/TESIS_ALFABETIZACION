/**
 * @module services/progressionService
 * @description Servicio de Progresión Algorítmica para FitoABC.
 *
 * Encapsula toda la lógica de negocio pedagógica:
 *  - Evaluación del Gate (gating logic) para avanzar de sub-nivel o nivel
 *  - Cálculo de XP ganado por sesión
 *  - Orquestación del flujo completo de fin de sesión
 *
 * Sistema de Sub-niveles:
 *  A → INTRODUCCIÓN  (ítems nuevos con alta ayuda de Fito)
 *  B → PRÁCTICA      (ítems nuevos + SR, sin tanta ayuda)
 *  C → EVALUACIÓN    (sin ayuda, mide dominio real para el gate principal)
 *
 * Gate A → B: racha >= 4 respuestas correctas seguidas
 * Gate B → C: precisión >= 75% con mínimo 6 intentos
 * Gate C → Nivel+1: precisión >= 80% AND racha >= 5 AND sesiones_en_C >= 2
 */
import Progress from '../models/progressModel.js';
import User from '../models/userModel.js';
import { processBatchQueueUpdate } from './spacedRepetitionService.js';

// ─── Constantes de Gating ─────────────────────────────────────────────────────

const GATE = {
  A_TO_B: {
    rachaMinima: 4,
  },
  B_TO_C: {
    precisionMinima: 0.75,
    intentosMinimos: 6,
  },
  C_TO_NEXT_LEVEL: {
    precisionMinima: 0.80,
    rachaMinima: 5,
    sesionesEnCMinimas: 2,
  },
};

// ─── Tabla de XP ──────────────────────────────────────────────────────────────

const XP = {
  ITEM_CORRECTO_NUCLEO: 10,
  ITEM_CORRECTO_SR_WARMUP: 5,
  ITEM_CORRECTO_MINIJUEGO: 5,
  BONUS_SESION_COMPLETA: 20,
  BONUS_NIVEL_DESBLOQUEADO: 100,
  BONUS_RACHA_5: 15,
};

// ─── Funciones de Gating ──────────────────────────────────────────────────────

/**
 * Determina el siguiente sub-nivel o nivel basado en el rendimiento.
 *
 * @param {Object} progressDoc  - Documento de progreso actual del usuario.
 * @param {Object} sessionStats - Estadísticas de la sesión que terminó.
 * @param {number} sessionStats.correctWords
 * @param {number} sessionStats.incorrectWords
 * @param {number} sessionStats.rachaAciertosActual
 * @returns {Object} { puedeAvanzar, nuevoSubNivel, nuevoNivel, motivoBloqueo, sesionesEnCActualizadas }
 */
export function evaluateGate(progressDoc, sessionStats) {
  const { correctWords, incorrectWords, rachaAciertosActual } = sessionStats;
  const totalIntentos = correctWords + incorrectWords;
  const precision = totalIntentos > 0 ? correctWords / totalIntentos : 0;

  const subNivelActual = progressDoc?.subLevelId || 'A';
  const rachaGuardada = progressDoc?.rachaAciertos || 0;
  // Usar la racha máxima entre la guardada y la de esta sesión
  const rachaEfectiva = Math.max(rachaGuardada, rachaAciertosActual);

  // ── Gate: Sub-nivel A → B ─────────────────────────────────────────
  if (subNivelActual === 'A') {
    if (rachaEfectiva >= GATE.A_TO_B.rachaMinima) {
      return {
        puedeAvanzar: true,
        nuevoSubNivel: 'B',
        motivoBloqueo: null,
        sesionesEnCActualizadas: 0,
        rachaEfectiva,
        precision,
      };
    }
    return {
      puedeAvanzar: false,
      nuevoSubNivel: 'A',
      motivoBloqueo: `racha_insuficiente (necesita ${GATE.A_TO_B.rachaMinima}, tiene ${rachaEfectiva})`,
      sesionesEnCActualizadas: 0,
      rachaEfectiva,
      precision,
    };
  }

  // ── Gate: Sub-nivel B → C ─────────────────────────────────────────
  if (subNivelActual === 'B') {
    if (precision >= GATE.B_TO_C.precisionMinima && totalIntentos >= GATE.B_TO_C.intentosMinimos) {
      return {
        puedeAvanzar: true,
        nuevoSubNivel: 'C',
        motivoBloqueo: null,
        sesionesEnCActualizadas: 0,
        rachaEfectiva,
        precision,
      };
    }
    const motivo = precision < GATE.B_TO_C.precisionMinima
      ? `precision_insuficiente (necesita ${GATE.B_TO_C.precisionMinima * 100}%, tiene ${Math.round(precision * 100)}%)`
      : `intentos_insuficientes (necesita ${GATE.B_TO_C.intentosMinimos}, tiene ${totalIntentos})`;
    return {
      puedeAvanzar: false,
      nuevoSubNivel: 'B',
      motivoBloqueo: motivo,
      sesionesEnCActualizadas: 0,
      rachaEfectiva,
      precision,
    };
  }

  // ── Gate: Sub-nivel C → Siguiente Nivel (GATE PRINCIPAL) ──────────
  if (subNivelActual === 'C') {
    const sesionesEnC = (progressDoc?.sesionesEnSubC || 0) + 1; // Contar esta sesión
    const precisionAcumulada = progressDoc?.precisionAcumuladaSubC != null
      ? (progressDoc.precisionAcumuladaSubC + precision) / 2  // Promedio móvil simple
      : precision;

    if (
      precisionAcumulada >= GATE.C_TO_NEXT_LEVEL.precisionMinima &&
      rachaEfectiva >= GATE.C_TO_NEXT_LEVEL.rachaMinima &&
      sesionesEnC >= GATE.C_TO_NEXT_LEVEL.sesionesEnCMinimas
    ) {
      return {
        puedeAvanzar: true,
        nuevoSubNivel: 'A',         // El siguiente nivel empieza en A
        subeDeNivel: true,          // ← Flag especial: avanza al Nivel N+1
        motivoBloqueo: null,
        sesionesEnCActualizadas: sesionesEnC,
        precisionAcumuladaSubC: precisionAcumulada,
        rachaEfectiva,
        precision,
      };
    }

    // Construir mensaje de bloqueo detallado
    const razones = [];
    if (precisionAcumulada < GATE.C_TO_NEXT_LEVEL.precisionMinima)
      razones.push(`precision_acumulada_insuficiente (${Math.round(precisionAcumulada * 100)}% < 80%)`);
    if (rachaEfectiva < GATE.C_TO_NEXT_LEVEL.rachaMinima)
      razones.push(`racha_insuficiente (${rachaEfectiva} < ${GATE.C_TO_NEXT_LEVEL.rachaMinima})`);
    if (sesionesEnC < GATE.C_TO_NEXT_LEVEL.sesionesEnCMinimas)
      razones.push(`sesiones_en_C_insuficientes (${sesionesEnC} < ${GATE.C_TO_NEXT_LEVEL.sesionesEnCMinimas})`);

    return {
      puedeAvanzar: false,
      nuevoSubNivel: 'C',
      subeDeNivel: false,
      motivoBloqueo: razones.join(' | '),
      sesionesEnCActualizadas: sesionesEnC,
      precisionAcumuladaSubC: precisionAcumulada,
      rachaEfectiva,
      precision,
    };
  }

  // Fallback por si el subLevelId tiene un valor inesperado
  return {
    puedeAvanzar: false,
    nuevoSubNivel: subNivelActual,
    motivoBloqueo: `sub_nivel_desconocido: ${subNivelActual}`,
    sesionesEnCActualizadas: 0,
    rachaEfectiva,
    precision,
  };
}

// ─── Cálculo de XP ────────────────────────────────────────────────────────────

/**
 * Calcula el total de XP ganado en la sesión.
 *
 * @param {Object} sessionStats
 * @param {number} sessionStats.correctWords            - Aciertos en el núcleo.
 * @param {number} sessionStats.rachaAciertosMaxima     - Racha máxima alcanzada.
 * @param {number} sessionStats.srItemsPracticados      - Array de ítems SR practicados.
 * @param {boolean} sessionStats.nivelDesbloqueado      - Si se subió de nivel.
 * @returns {number} XP total ganado.
 */
export function calculateXP(sessionStats) {
  const {
    correctWords = 0,
    rachaAciertosMaxima = 0,
    srItemsPracticados = [],
    nivelDesbloqueado = false,
  } = sessionStats;

  let xp = 0;

  // XP por aciertos en el núcleo
  xp += correctWords * XP.ITEM_CORRECTO_NUCLEO;

  // XP por ítems SR practicados en warm-up
  const srCorrectos = srItemsPracticados.filter(i => i.resultado === 'correcto').length;
  xp += srCorrectos * XP.ITEM_CORRECTO_SR_WARMUP;

  // Bonus por completar sesión (siempre que haya habido actividad)
  if (correctWords > 0) {
    xp += XP.BONUS_SESION_COMPLETA;
  }

  // Bonus por racha >= 5
  if (rachaAciertosMaxima >= 5) {
    xp += XP.BONUS_RACHA_5;
  }

  // Mega bonus por desbloquear nuevo nivel
  if (nivelDesbloqueado) {
    xp += XP.BONUS_NIVEL_DESBLOQUEADO;
  }

  return xp;
}

// ─── Orquestador Principal ────────────────────────────────────────────────────

/**
 * Procesa el fin de sesión completo:
 * 1. Actualiza la cola de repetición espaciada (SR)
 * 2. Evalúa el gate para subir de sub-nivel o nivel
 * 3. Upserta el progreso en la colección Progress
 * 4. Calcula el XP ganado
 *
 * @param {string} userId   - ObjectId del usuario en MongoDB.
 * @param {string} clerkId  - Clerk ID del usuario (para resolver ObjectId en Progress).
 * @param {Object} payload  - Datos completos del fin de sesión.
 * @returns {Promise<Object>} Resultado con xpGanado y gateStatus.
 */
export async function processEndOfSession(userId, clerkId, payload) {
  const {
    levelId,
    subLevelId,
    correctWords,
    incorrectWords,
    rachaAciertosMaxima,
    rachaAciertosActual,
    palabrasFalladas = [],
    srItemsPracticados = [],
  } = payload;

  // ── 1. Actualizar cola de Repetición Espaciada ────────────────────
  await processBatchQueueUpdate(userId, palabrasFalladas, srItemsPracticados);

  // ── 2. Obtener progreso actual del sub-nivel para evaluar el gate ──
  const progressDoc = await Progress.findOne({ userId, levelId, subLevelId })
    .select('subLevelId rachaAciertos sesionesEnSubC precisionAcumuladaSubC score accuracyPercentage highestStreak');

  const sessionStats = {
    correctWords,
    incorrectWords,
    rachaAciertosActual,
    rachaAciertosMaxima,
    srItemsPracticados,
  };

  // ── 3. Evaluar Gate ───────────────────────────────────────────────
  const gateResult = evaluateGate(progressDoc, sessionStats);

  const nivelDesbloqueado = gateResult.subeDeNivel === true;

  // ── 4. Calcular XP ────────────────────────────────────────────────
  const xpGanado = calculateXP({ ...sessionStats, nivelDesbloqueado });

  // ── 5. Calcular métricas para upsert ──────────────────────────────
  const totalIntentos = correctWords + incorrectWords;
  const precisionSesion = totalIntentos > 0
    ? Math.round((correctWords / totalIntentos) * 100)
    : 0;

  const nuevoSubNivel = gateResult.nuevoSubNivel;
  const nuevoStatus = nivelDesbloqueado ? 'completed' : 'in_progress';

  // ── 6. Upsert de Progreso ─────────────────────────────────────────
  // Si el niño sube de nivel, marcamos el sub-nivel C como completed
  // y creamos un nuevo registro en_progreso para el Nivel N+1 / Sub-A
  await Progress.upsertProgress(
    clerkId,
    levelId,
    subLevelId,
    nuevoSubNivel,
    nuevoStatus,
    xpGanado,
    precisionSesion,
    gateResult.rachaEfectiva,
    gateResult.sesionesEnCActualizadas,
    gateResult.precisionAcumuladaSubC ?? progressDoc?.precisionAcumuladaSubC ?? 0,
  );

  // ── 7. Construir respuesta ────────────────────────────────────────
  return {
    xpGanado,
    gateStatus: {
      puedeAvanzarNivel: nivelDesbloqueado,
      motivoBloqueo: gateResult.motivoBloqueo,
      nivelActual: levelId,
      subNivelActual: nuevoSubNivel,
      precisionSesion: `${precisionSesion}%`,
      rachaEfectiva: gateResult.rachaEfectiva,
    },
  };
}
