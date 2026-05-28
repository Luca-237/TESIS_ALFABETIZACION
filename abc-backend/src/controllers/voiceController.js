import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vosk from 'vosk';
import * as googleTTS from 'google-tts-api';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configuramos ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// 1. Inicializar el modelo de Vosk con ruta absoluta segura
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = path.join(__dirname, '../utils/vosk-model-es');

let model;
try {
    vosk.setLogLevel(0); 
    model = new vosk.Model(modelPath);
    console.log("Modelo de Vosk cargado exitosamente.");
} catch (error) {
    console.error("No se encontró el modelo de Vosk en la ruta:", modelPath);
}

// ENDPOINT 1: Speech-to-Text (Escuchar al niño)
export const processSpeech = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo de audio' });
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}.wav`;

    try {
        ffmpeg(inputPath)
            .toFormat('wav')
            .audioChannels(1)
            .audioFrequency(16000)
            .on('end', () => {
                const rec = new vosk.Recognizer({ model: model, sampleRate: 16000 });
                const buffer = fs.readFileSync(outputPath);
                rec.acceptWaveform(buffer);
                const result = rec.finalResult();

                // Limpiamos los archivos temporales
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

                // Opcional: Validar si result.text coincide con la palabra del nivel
                // y sumar puntos al "registro maestro" de la tabla de usuarios.

                res.status(200).json({ text: result.text });
                rec.free();
            })
            .on('error', (err) => {
                console.error("Error convirtiendo audio:", err);
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                res.status(500).json({ error: 'Error procesando el audio' });
            })
            .save(outputPath);
    } catch (error) {
        console.error("Error general procesando voz:", error);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ENDPOINT 2: Text-to-Speech (Hablarle al niño en memoria RAM)
export const generateSpeech = async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Falta el texto a pronunciar' });
    }

    try {
        // 1. Obtenemos la URL de la voz generada por Google
        const url = googleTTS.getAudioUrl(text, {
            lang: 'es',
            slow: false,
            host: 'https://translate.google.com',
        });

        // 2. Descargamos el audio en memoria RAM usando fetch nativo de Node 20
        const audioResponse = await fetch(url);
        const arrayBuffer = await audioResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Enviamos los bytes directamente al frontend (Sin usar el disco duro)
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length
        });
        res.send(buffer);

    } catch (error) {
        console.error("Error generando voz:", error);
        res.status(500).json({ error: 'Error interno generando voz' });
    }
};