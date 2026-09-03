/**
 * @module controllers/voiceController
 * @description Controlador del Motor de Voz de FitoABC.
 *
 * Configuración estilo "Neural2" Infantil:
 *  - Voz primaria: 'es-MX-DaliaNeural' (Equivalente a Google Cloud Neural2-A:
 *    clara, cálida, alegre y dulce para niños, sin ser grave ni chillona).
 *  - Pitch: +3% (Tono natural y alegre)
 *  - Rate: +2% (Cadencia clara y amigable)
 *  - Cache en memoria RAM: Entrega frases en < 5ms para inicio inmediato del diálogo.
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import * as googleTTS from 'google-tts-api';

const VOICE_MAP = {
  neural2: { name: 'es-MX-DaliaNeural', pitch: '+3%', rate: '+2%' },
  dalia:   { name: 'es-MX-DaliaNeural', pitch: '+3%', rate: '+2%' },
  alonso:  { name: 'es-US-AlonsoNeural', pitch: '+5%', rate: '+3%' },
  tomas:   { name: 'es-AR-TomasNeural',  pitch: '+7%', rate: '+3%' },
};

// ── Cache en RAM para reproducción instantánea (< 5ms) ───────────
const memoryAudioCache = new Map();
const MAX_CACHE_ENTRIES = 150;

/**
 * Genera audio mediante Edge Neural TTS con estilo Neural2.
 * @param {string} text - Texto a pronunciar.
 * @param {string} selectedVoiceKey - Clave de voz opcional ('neural2', 'dalia', 'alonso', 'tomas').
 * @returns {Promise<Buffer>} Audio MP3 en memoria.
 */
const generateNeuralTTS = async (text, selectedVoiceKey = 'neural2') => {
  const config = VOICE_MAP[selectedVoiceKey] || VOICE_MAP.neural2;
  const tts = new MsEdgeTTS();

  await tts.setMetadata(config.name, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  
  const { audioStream } = tts.toStream(text, {
    pitch: config.pitch,
    rate: config.rate,
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    audioStream.on('data', chunk => chunks.push(chunk));
    audioStream.on('end', () => resolve(Buffer.concat(chunks)));
    audioStream.on('error', err => reject(err));
  });
};

/**
 * Fallback a Google TTS tradicional en caso de contingencia offline.
 */
const generateGoogleTTS = async (text) => {
  const urls = googleTTS.getAllAudioUrls(text, {
    lang: 'es',
    slow: false,
    host: 'https://translate.google.com',
  });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://translate.google.com/',
  };

  const audioChunks = await Promise.all(
    urls.map(async ({ url }) => {
      const audioResponse = await fetch(url, { headers });
      if (!audioResponse.ok) {
        throw new Error(`Google TTS status: ${audioResponse.status}`);
      }
      const arrayBuffer = await audioResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    })
  );

  return Buffer.concat(audioChunks);
};

/**
 * POST /api/voice/speak
 * Genera audio MP3 con voz alegre y natural estilo Neural2 con cache en RAM de ultra-baja latencia.
 */
export const generateSpeech = async (req, res) => {
  const { text, voice } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Falta el texto a pronunciar' });
  }

  const voiceKey = voice || 'neural2';
  const cacheKey = `${voiceKey}:${text.trim()}`;

  // 1. Si ya está en memoria RAM, responder instantáneamente en ~2ms
  if (memoryAudioCache.has(cacheKey)) {
    const cachedBuffer = memoryAudioCache.get(cacheKey);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': cachedBuffer.length,
      'X-Audio-Cache': 'HIT',
    });
    return res.send(cachedBuffer);
  }

  try {
    let audioBuffer;

    try {
      // 2. Intentar voz neuronal estilo Neural2 infantil
      audioBuffer = await generateNeuralTTS(text, voiceKey);
    } catch (edgeError) {
      console.warn('⚠️ Edge Neural TTS falló, recurriendo a Google TTS:', edgeError.message);
      audioBuffer = await generateGoogleTTS(text);
    }

    // Guardar en cache RAM con política FIFO
    if (memoryAudioCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = memoryAudioCache.keys().next().value;
      memoryAudioCache.delete(oldestKey);
    }
    memoryAudioCache.set(cacheKey, audioBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'X-Audio-Cache': 'MISS',
    });

    res.send(audioBuffer);

  } catch (error) {
    console.error('❌ Error generando voz estilo Neural2:', error);
    res.status(500).json({ error: 'Error interno generando voz' });
  }
};