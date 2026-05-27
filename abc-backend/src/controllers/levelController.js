import LevelModel from '../models/levelModel.js';

export const getLevels = async (req, res) => {
    try {
        const levels = await LevelModel.findAll();
        res.status(200).json({ data: levels });
    } catch (error) {
        console.error("Error obteniendo niveles:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const getLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const level = await LevelModel.findById(id);
        if (!level) return res.status(404).json({ error: 'Nivel no encontrado' });
        
        res.status(200).json({ data: level });
    } catch (error) {
        console.error("Error obteniendo nivel:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};