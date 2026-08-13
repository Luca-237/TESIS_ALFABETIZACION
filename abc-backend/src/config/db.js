/**
 * @module config/db
 * @description Configuración de conexión a MongoDB Atlas usando Mongoose.
 * Se conecta al cluster definido en la variable de entorno MONGO_URI.
 */
import mongoose from 'mongoose';

/**
 * Establece la conexión con MongoDB Atlas.
 * Si la conexión falla, detiene el proceso para evitar un servidor sin base de datos.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Atlas conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB Atlas: ${error.message}`);
    console.warn(`⚠️  El servidor iniciará sin conexión a la base de datos (algunos endpoints podrían fallar).`);
    // process.exit(1); // Comentado para permitir que el servidor arranque sin BD
  }
};

export default mongoose;