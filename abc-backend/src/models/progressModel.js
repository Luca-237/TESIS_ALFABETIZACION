import pool from '../config/db.js';

class ProgressModel {
    static async findByUserClerkId(clerkId) {
        const query = `
            SELECT p.id, p.level_id, p.status, p.score, p.completed_at
            FROM user_progress p
            JOIN users u ON p.user_id = u.id
            WHERE u.clerk_id = $1
        `;
        const { rows } = await pool.query(query, [clerkId]);
        return rows;
    }

    static async upsertProgress(clerkId, levelId, status, score) {
        const query = `
            INSERT INTO user_progress (user_id, level_id, status, score, completed_at)
            VALUES (
                (SELECT id FROM users WHERE clerk_id = $1),
                $2, $3, $4,
                CASE WHEN $3 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
            )
            ON CONFLICT (user_id, level_id)
            DO UPDATE SET 
                status = EXCLUDED.status,
                score = GREATEST(user_progress.score, EXCLUDED.score),
                completed_at = COALESCE(user_progress.completed_at, EXCLUDED.completed_at)
            RETURNING id, level_id, status, score, completed_at;
        `;
        const { rows } = await pool.query(query, [clerkId, levelId, status, score]);
        return rows[0];
    }
}

export default ProgressModel;