import pool from '../config/db.js';

class SessionModel {
    static async saveSessionAndUpdatePoints(userId, duration, correctWords, incorrectWords, isDiagnostic, pointsEarned) {
        // Solicitamos un cliente exclusivo del pool para la transacción
        const client = await pool.connect();
        
        try {
            // Iniciamos la transacción
            await client.query('BEGIN');

            // 1. Insertamos la sesión
            const insertSessionQuery = `
                INSERT INTO sessions (user_id, duration_seconds, correct_words, incorrect_words, is_diagnostic_test)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, session_date
            `;
            const sessionValues = [userId, duration, correctWords, incorrectWords, isDiagnostic];
            const sessionResult = await client.query(insertSessionQuery, sessionValues);
            const newSession = sessionResult.rows[0];

            // 2. Actualizamos los puntos totales del usuario
            if (pointsEarned > 0) {
                const updatePointsQuery = `
                    UPDATE users 
                    SET total_points = total_points + $1 
                    WHERE id = $2
                `;
                await client.query(updatePointsQuery, [pointsEarned, userId]);
            }

            // Confirmamos los cambios en la base de datos
            await client.query('COMMIT');
            
            return newSession;
            
        } catch (error) {
            // Si algo falla, revertimos todos los cambios
            await client.query('ROLLBACK');
            console.error("Error en la transacción de sesión:", error);
            throw error; // Lanzamos el error para que el controlador lo maneje
        } finally {
            // MUY IMPORTANTE: Devolvemos el cliente al pool
            client.release();
        }
    }
}

export default SessionModel;