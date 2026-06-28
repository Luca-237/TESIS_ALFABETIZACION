/**
 * @module controllers/voiceController
 * @description Controlador del Motor de Voz.
 * 
 * Maneja los dos endpoints de voz de FitoABC:
 * 1. STT (Speech-to-Text): Escucha al niño usando Vosk offline.
 * 2. TTS (Text-to-Speech): Le habla al niño usando Google TTS en RAM.
 * 
 * Ninguno de estos endpoints depende de la base de datos.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vosk from 'vosk';
import * as googleTTS from 'google-tts-api';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configuramos la ruta del binario de FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ─── Inicialización de Vosk (STT offline) ─────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = path.join(__dirname, '../utils/vosk-model-es');

let model;
try {
  vosk.setLogLevel(0); // Silenciar logs internos de Vosk
  model = new vosk.Model(modelPath);
  console.log('✅ Modelo de Vosk cargado exitosamente.');
} catch (error) {
  console.error('⚠️  No se encontró el modelo de Vosk en:', modelPath);
}

// ─── Endpoint 1: Speech-to-Text ───────────────────────────────────

/**
 * POST /api/voice/listen
 * Recibe un archivo de audio del micrófono del frontend,
 * lo convierte a WAV 16kHz mono con FFmpeg, y lo transcribe con Vosk.
 * Los archivos temporales se eliminan después de procesar.
 */
export const processSpeech = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo de audio' });
  }

  const inputPath = req.file.path;
  const outputPath = `${inputPath}.wav`;

  try {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioChannels(1)       // Mono (requerido por Vosk)
      .audioFrequency(16000)  // 16kHz (requerido por Vosk)
      .on('end', () => {
        // Transcribimos el audio convertido
        const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });
        const buffer = fs.readFileSync(outputPath);
        rec.acceptWaveform(buffer);
        const result = rec.finalResult();

        // Limpiamos archivos temporales del disco
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        res.status(200).json({ text: result.text });
        rec.free();
      })
      .on('error', (err) => {
        console.error('❌ Error convirtiendo audio:', err);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        res.status(500).json({ error: 'Error procesando el audio' });
      })
      .save(outputPath);
  } catch (error) {
    console.error('❌ Error general procesando voz:', error);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ─── Endpoint 2: Text-to-Speech ───────────────────────────────────

/**
 * POST /api/voice/speak
 * Recibe un texto y devuelve un archivo de audio MP3 generado por
 * Google TTS. Todo se procesa en memoria RAM (sin guardar en disco).
 * Soporta textos largos mediante chunking automático de google-tts-api.
 */
export const generateSpeech = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Falta el texto a pronunciar' });
  }

  try {
    // 1. Obtenemos las URLs de audio (maneja chunks si texto > ~200 chars)
    const urls = googleTTS.getAllAudioUrls(text, {
      lang: 'es',
      slow: false,
      host: 'https://translate.google.com',
    });

    // 2. Descargamos cada chunk con headers de navegador para evitar bloqueos
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
    };

    const audioChunks = await Promise.all(
      urls.map(async ({ url }) => {
        const audioResponse = await fetch(url, { headers });

        if (!audioResponse.ok) {
          throw new Error(`Google TTS respondió con status ${audioResponse.status}`);
        }

        const arrayBuffer = await audioResponse.arrayBuffer();
        return Buffer.from(arrayBuffer);
      })
    );

    // 3. Concatenamos los chunks y enviamos el audio al frontend
    const buffer = Buffer.concat(audioChunks);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error generando voz:', error);
    res.status(500).json({ error: 'Error interno generando voz' });
  }
};