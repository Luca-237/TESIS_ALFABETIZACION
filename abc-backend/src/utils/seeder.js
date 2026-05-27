import pool from '../config/db.js';

const seedDatabase = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar si ya existen niveles para no duplicar datos
        const checkLevels = await client.query('SELECT COUNT(*) FROM levels');
        if (parseInt(checkLevels.rows[0].count) > 0) {
            console.log('La base de datos ya tiene datos. Omitiendo seeder.');
            return;
        }

        console.log('Iniciando el poblado (seeding) de la base de datos...');

        // 2. Insertar los Niveles Base (Extraídos de tus requerimientos)
        const levelsData = [
            { order: 1, title: 'Construcción de sílabas', desc: 'Aprender sílabas básicas como ma-me-mi.', diag: false },
            { order: 2, title: 'Lectura de sílabas en palabras', desc: 'Identificar sílabas verdes en palabras simples.', diag: false },
            { order: 3, title: 'Orden de sílabas simples', desc: 'Juego para ordenar sílabas.', diag: false },
            { order: 4, title: 'Lectura de palabra simple', desc: 'Leer la palabra para revelar la imagen oculta.', diag: false },
            { order: 5, title: 'Sílabas complejas', desc: 'Aprender sílabas como bra, tre, gri.', diag: false },
            { order: 6, title: 'Test Diagnóstico', desc: 'Evaluación inicial de lectura.', diag: true }
        ];

        // Insertamos y guardamos los IDs generados para usarlos en el diccionario
        const levelIds = {};
        for (const lvl of levelsData) {
            const res = await client.query(
                `INSERT INTO levels (level_order, title, description, is_diagnostic) 
                 VALUES ($1, $2, $3, $4) RETURNING id, level_order`,
                [lvl.order, lvl.title, lvl.desc, lvl.diag]
            );
            levelIds[lvl.order] = res.rows[0].id; // Mapeamos: order -> id
        }

        // 3. Insertar Diccionario de Contenido vinculado a los niveles
        const dictionaryData = [
            // Nivel 1: Construcción de Sílabas
            { level_id: levelIds[1], word: 'mama', syllables: ['ma', 'ma'], img: '/assets/mama.png', complex: false },
            { level_id: levelIds[1], word: 'mesa', syllables: ['me', 'sa'], img: '/assets/mesa.png', complex: false },
            
            // Nivel 4: Palabras Simples (Imágenes que saltan)
            { level_id: levelIds[4], word: 'pato', syllables: ['pa', 'to'], img: '/assets/pato.png', complex: false },
            { level_id: levelIds[4], word: 'sol', syllables: ['sol'], img: '/assets/sol.png', complex: false },

            // Nivel 5: Sílabas Complejas
            { level_id: levelIds[5], word: 'brazo', syllables: ['bra', 'zo'], img: '/assets/brazo.png', complex: true },
            { level_id: levelIds[5], word: 'tigre', syllables: ['ti', 'gre'], img: '/assets/tigre.png', complex: true }
        ];

        for (const dict of dictionaryData) {
            await client.query(
                `INSERT INTO content_dictionary (level_id, word, syllables, image_url, is_complex_syllable) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [dict.level_id, dict.word, dict.syllables, dict.img, dict.complex]
            );
        }

        await client.query('COMMIT');
        console.log('Seeding completado con éxito. ¡FitoABC está listo!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error durante el seeding:', error);
    } finally {
        client.release();
        // Cerramos el pool para que el script termine su ejecución
        await pool.end(); 
    }
};

seedDatabase();