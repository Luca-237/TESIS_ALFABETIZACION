import pool from '../config/db.js';

class LevelModel {
    // Obtener todos los niveles ordenados para mostrar el "Mapa"
    static async findAll() {
        const query = `
            SELECT id, level_order, title, description, is_diagnostic 
            FROM levels 
            ORDER BY level_order ASC
        `;
        const { rows } = await pool.query(query);
        return rows;
    }

    // Obtener un nivel específico
    static async findById(id) {
        const query = 'SELECT * FROM levels WHERE id = $1';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
}

export default LevelModel;