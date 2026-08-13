/**
 * @module controllers/voiceController
 * @description Controlador del Motor de Voz.
 * 
 * Maneja el endpoint de voz de FitoABC:
 * 1. TTS (Text-to-Speech): Le habla al niño usando Google TTS en RAM.
 * 
 * Este endpoint no depende de la base de datos.
 */
import * as googleTTS from 'google-tts-api';

// ─── Endpoint: Text-to-Speech ───────────────────────────────────

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