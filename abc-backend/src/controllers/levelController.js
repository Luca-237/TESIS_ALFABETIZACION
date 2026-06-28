/**
 * @module controllers/levelController
 * @description Controlador de Niveles.
 * 
 * Expone los niveles de la currícula pedagógica para que el frontend
 * pueda mostrar el mapa de progresión al niño.
 */
import Level from '../models/levelModel.js';

/**
 * GET /api/levels
 * Obtiene todos los niveles ordenados por su secuencia.
 */
export const getLevels = async (req, res) => {
  try {
    const levels = await Level.findAllOrdered();
    res.status(200).json({ data: levels });
  } catch (error) {
    console.error('❌ Error obteniendo niveles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * GET /api/levels/:id
 * Obtiene un nivel específico por su ID.
 */
export const getLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await Level.findById(id);

    if (!level) {
      return res.status(404).json({ error: 'Nivel no encontrado' });
    }

    res.status(200).json({ data: level });
  } catch (error) {
    console.error('❌ Error obteniendo nivel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};