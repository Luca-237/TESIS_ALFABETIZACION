import ContentModel from '../models/contentModel.js';

export const getDictionary = async (req, res) => {
    try {
        const { levelId } = req.params;
        const dictionary = await ContentModel.getDictionaryByLevel(levelId);
        res.status(200).json({ data: dictionary });
    } catch (error) {
        console.error("Error obteniendo diccionario:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};