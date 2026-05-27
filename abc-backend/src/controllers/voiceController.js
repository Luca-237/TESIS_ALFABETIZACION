import fs from 'fs';
import path from 'path';
import vosk from 'vosk';
import gTTS from 'gtts';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configuramos ffmpeg para que funcione sin depender de instalaciones externas
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// 1. Inicializar el modelo de Vosk (Asegúrate de tener la carpeta en src/utils/vosk-model-es)
let model;
try {
    const modelPath = path.join(process.cwd(), 'src/utils/vosk-model-es');
    vosk.setLogLevel(0); // Ocultar logs innecesarios en consola
    model = new vosk.Model(modelPath);
    console.log("Modelo de Vosk cargado exitosamente.");
} catch (error) {
    console.error("No se encontró el modelo de Vosk. Asegúrate de descargarlo y ponerlo en src/utils/vosk-model-es");
}

// ENDPOINT 1: Speech-to-Text (Escuchar al niño)
export const processSpeech = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo de audio' });
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}.wav`;

    // Convertimos el audio entrante (ej. webm del navegador) a WAV 16kHz mono para Vosk
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
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            // Opcional: Aquí podrías validar si result.text coincide con la palabra del nivel
            // y sumar puntos al "registro maestro" de la tabla de usuarios.

            res.status(200).json({ text: result.text });
            rec.free();
        })
        .on('error', (err) => {
            console.error("Error convirtiendo audio:", err);
            res.status(500).json({ error: 'Error procesando el audio' });
        })
        .save(outputPath);
};

// ENDPOINT 2: Text-to-Speech (Hablarle al niño)
export const generateSpeech = (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Falta el texto a pronunciar' });
    }

    try {
        const tts = new gTTS(text, 'es');
        
        // Creamos una ruta temporal segura dentro de tu carpeta uploads
        const fileName = `tts_${Date.now()}.mp3`;
        const filePath = path.join(process.cwd(), 'uploads', fileName);

        // 1. Guardamos el archivo primero
        tts.save(filePath, (err) => {
            if (err) {
                console.error("Error guardando el archivo de voz:", err);
                return res.status(500).json({ error: 'Error generando la voz' });
            }
            
            // 2. Lo enviamos de forma segura al cliente
            res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    console.error("Error enviando el archivo:", sendErr);
                }
                
                // 3. Borramos el archivo temporal para no llenar tu disco
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        });

    } catch (error) {
        console.error("Error generando voz:", error);
        res.status(500).json({ error: 'Error interno generando voz' });
    }
};