import pool from '../config/db.js';

class ContentModel {
    static async getDictionaryByLevel(levelId) {
        const query = 'SELECT word, syllables, image_url, audio_url FROM content_dictionary WHERE level_id = $1';
        const { rows } = await pool.query(query, [levelId]);
        return rows;
    }
}
export default ContentModel;