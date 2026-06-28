/**
 * @module utils/seeder
 * @description Script para poblar la base de datos con datos iniciales.
 * 
 * Inserta los niveles de la currícula y el diccionario de contenido
 * base necesario para que FitoABC funcione. Verifica si ya existen
 * datos para no duplicar registros.
 * 
 * Uso: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Level from '../models/levelModel.js';
import Content from '../models/contentModel.js';
import Activity from '../models/activityModel.js';

/**
 * Ejecuta el poblado de la base de datos.
 */
const seedDatabase = async () => {
  try {
    // Conectamos directamente a MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB Atlas para seeding');

    // ─── Verificación ─────────────────────────────────────────
    const existingLevels = await Level.countDocuments();
    if (existingLevels > 0) {
      console.log('ℹ️  La base de datos ya tiene datos. Omitiendo seeder.');
      return;
    }

    console.log('🌱 Iniciando el poblado (seeding) de la base de datos...');

    // ─── 1. Insertar Niveles ──────────────────────────────────
    const levelsData = [
      { levelOrder: 1, title: 'Construcción de sílabas', description: 'Aprender sílabas básicas como ma-me-mi.', isDiagnostic: false },
      { levelOrder: 2, title: 'Lectura de sílabas en palabras', description: 'Identificar sílabas verdes en palabras simples.', isDiagnostic: false },
      { levelOrder: 3, title: 'Orden de sílabas simples', description: 'Juego para ordenar sílabas.', isDiagnostic: false },
      { levelOrder: 4, title: 'Lectura de palabra simple', description: 'Leer la palabra para revelar la imagen oculta.', isDiagnostic: false },
      { levelOrder: 5, title: 'Sílabas complejas', description: 'Aprender sílabas como bra, tre, gri.', isDiagnostic: false },
      { levelOrder: 6, title: 'Test Diagnóstico', description: 'Evaluación inicial de lectura.', isDiagnostic: true },
    ];

    const levels = await Level.insertMany(levelsData);
    console.log(`   ✓ ${levels.length} niveles insertados`);

    // Creamos un mapa levelOrder → ObjectId para vincular el diccionario
    const levelMap = {};
    levels.forEach(lvl => { levelMap[lvl.levelOrder] = lvl._id; });

    // ─── 2. Insertar Diccionario de Contenido ─────────────────
    const dictionaryData = [
      // Nivel 1: Construcción de Sílabas
      { levelId: levelMap[1], word: 'mama', syllables: ['ma', 'ma'], imageUrl: '/assets/mama.png' },
      { levelId: levelMap[1], word: 'mesa', syllables: ['me', 'sa'], imageUrl: '/assets/mesa.png' },

      // Nivel 4: Palabras Simples (imágenes que saltan al acertar)
      { levelId: levelMap[4], word: 'pato', syllables: ['pa', 'to'], imageUrl: '/assets/pato.png' },
      { levelId: levelMap[4], word: 'sol', syllables: ['sol'], imageUrl: '/assets/sol.png' },

      // Nivel 5: Sílabas Complejas
      { levelId: levelMap[5], word: 'brazo', syllables: ['bra', 'zo'], imageUrl: '/assets/brazo.png' },
      { levelId: levelMap[5], word: 'tigre', syllables: ['ti', 'gre'], imageUrl: '/assets/tigre.png' },
    ];

    const content = await Content.insertMany(dictionaryData);
    console.log(`   ✓ ${content.length} palabras del diccionario insertadas`);

    // ─── 3. Insertar Actividades / Minijuegos ─────────────────
    const activitiesData = [
      { name: 'Ruleta de Letras', activityType: 'roulette' },
      { name: 'Abrecajas', activityType: 'box_opening' },
      { name: 'Une las Parejas', activityType: 'matching' },
      { name: 'Lectura Guiada', activityType: 'reading' },
      { name: 'Ordená las Sílabas', activityType: 'ordering' },
    ];

    const activities = await Activity.insertMany(activitiesData);
    console.log(`   ✓ ${activities.length} actividades insertadas`);

    console.log('🎉 Seeding completado con éxito. ¡FitoABC está listo!');

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
};

seedDatabase();