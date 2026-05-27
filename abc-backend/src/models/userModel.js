import pool from '../config/db.js';

class UserModel {
    static async findByClerkId(clerkId) {
        const query = `
            SELECT id, name, email, total_points, theme_preference 
            FROM users 
            WHERE clerk_id = $1
        `;
        const { rows } = await pool.query(query, [clerkId]);
        return rows[0]; // Retorna el usuario o undefined si no existe
    }

    static async create(clerkId, name, email, profileImageUrl) {
        const query = `
            INSERT INTO users (clerk_id, name, email, profile_image_url)
            VALUES ($1, $2, $3, $4)
            RETURNING id, clerk_id, name, total_points, theme_preference
        `;
        const values = [clerkId, name, email, profileImageUrl];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    static async updateThemePreference(userId, theme) {
        const query = `
            UPDATE users 
            SET theme_preference = $1 
            WHERE id = $2 
            RETURNING id, theme_preference
        `;
        const { rows } = await pool.query(query, [theme, userId]);
        return rows[0];
    }
}

export default UserModel;