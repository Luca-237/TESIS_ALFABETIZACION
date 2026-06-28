/**
 * @module controllers/contentController
 * @description Controlador del Diccionario de Contenido.
 * 
 * Provee las palabras, sílabas e imágenes de cada nivel
 * para que el frontend arme las actividades de lectura.
 */
import Content from '../models/contentModel.js';

/**
 * GET /api/content/dictionary/:levelId
 * Obtiene todo el diccionario de un nivel específico.
 */
export const getDictionary = async (req, res) => {
  try {
    const { levelId } = req.params;
    const dictionary = await Content.getDictionaryByLevel(levelId);
    res.status(200).json({ data: dictionary });
  } catch (error) {
    console.error('❌ Error obteniendo diccionario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};