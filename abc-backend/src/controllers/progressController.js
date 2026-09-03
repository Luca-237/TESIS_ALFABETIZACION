/**
 * @module controllers/progressController
 * @description Controlador de Progreso del Usuario.
 * 
 * Gestiona la consulta y actualización del avance del niño
 * a través de los niveles de la plataforma.
 */
import Progress from '../models/progressModel.js';

/**
 * GET /api/progress
 * Obtiene todo el progreso del usuario autenticado.
 */
export const getUserProgress = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const progress = await Progress.findByUserClerkId(clerkId);
    res.status(200).json({ data: progress });
  } catch (error) {
    console.error('❌ Error obteniendo progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/progress/:levelId
 * Actualiza o crea el progreso del usuario en un nivel específico.
 * Conserva siempre el puntaje más alto obtenido.
 *
 * Body: { subLevelId, nuevoSubNivel, status, score, accuracy, streak }
 *  - subLevelId:    sub-nivel actual (antes del gate), ej: "A"
 *  - nuevoSubNivel: sub-nivel resultante del gate, ej: "B"
 *  - status:        'in_progress' | 'completed'
 */
export const updateProgress = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { levelId } = req.params;
    const { subLevelId = 'A', nuevoSubNivel, status, score, accuracy, streak } = req.body;

    // Validación del estado de progreso
    if (!['locked', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Estado de progreso inválido' });
    }
    if (!['A', 'B', 'C'].includes(subLevelId)) {
      return res.status(400).json({ error: 'subLevelId debe ser A, B o C' });
    }

    const updatedProgress = await Progress.upsertProgress(
      clerkId,
      levelId,
      subLevelId,
      nuevoSubNivel || subLevelId,   // Si no se indica nuevo, queda en el mismo
      status,
      score || 0,
      accuracy || 0,
      streak || 0,
    );

    res.status(200).json({
      message: 'Progreso actualizado exitosamente',
      data: updatedProgress,
    });
  } catch (error) {
    console.error('❌ Error actualizando progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};