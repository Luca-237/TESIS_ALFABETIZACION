import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Star, Heart, RotateCcw, Map, Mic, MicOff, CheckCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import './Classroom.css';

// ─── Componente de imagen con fallback a emoji ────────────────────────────────
const WordImage = ({ wordObj, className }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <>
      {!imgError && (
        <img
          src={`/${wordObj.word}.png`}
          alt={wordObj.word}
          className={className + ' word-image'}
          onError={() => setImgError(true)}
        />
      )}
      {imgError && <span className={className}>{wordObj.icon}</span>}
    </>
  );
};

// ─── Generador de Pista Fonológica con Énfasis en la Sílaba Inicial ───────────
// En lugar de dar la respuesta explícita (ej: "empieza con MA"),
// acentúa y alarga la sílaba inicial para que el niño deduzca el sonido:
// Ej: 'puerta' -> 'PUUU-erta'
// Ej: 'manzana' -> 'MAAA-nzana'
export const createPhoneticSyllableEmphasis = (word, syllable) => {
  if (!word) return '';
  const cleanWord = word.trim();
  const syl = (syllable || '').toLowerCase().trim();
  const lowerWord = cleanWord.toLowerCase();

  if (syl && lowerWord.startsWith(syl)) {
    const consonant = syl.slice(0, 1).toUpperCase();
    const vowel = syl.slice(1).toUpperCase();
    const rest = cleanWord.slice(syl.length);

    // Alargamos la vocal a 3 repeticiones con guion para forzar la dicción del TTS
    const elongatedSyl = consonant + (vowel ? vowel.repeat(3) : '') + '-';
    return `${elongatedSyl}${rest.toLowerCase()}`;
  }

  return cleanWord.toUpperCase();
};

// ─── Motor de Reconocimiento y Coincidencia de Sílabas Fonéticas ───────────────
export const checkSyllableMatch = (transcript, targetSyllable, targetWord) => {
  if (!transcript || !targetSyllable) return false;

  const clean = transcript
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  const syl = targetSyllable
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const word = (targetWord || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!clean || !syl) return false;

  // 1. Si el niño dijo la palabra completa correspondiente
  if (word && (clean.includes(word) || clean.split(/\s+/).includes(word))) {
    return true;
  }

  // 2. Si alguna palabra de la frase es exactamente la sílaba o empieza con ella
  const tokens = clean.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (token === syl) return true;
    if (token.startsWith(syl)) return true;
  }

  // 3. Deletreo fonético letra + vocal (ej: "eme a" para "ma", "pe o" para "po")
  const letterMap = {
    'm': ['eme', 'm'],
    'p': ['pe', 'p'],
    's': ['ese', 'es', 's'],
  };
  const consonant = syl[0];
  const vowel = syl[1];
  if (letterMap[consonant]) {
    for (const letName of letterMap[consonant]) {
      if (clean.includes(`${letName} ${vowel}`) || clean.includes(`${letName}${vowel}`)) {
        return true;
      }
    }
  }

  // 4. Diccionario de equivalencias acústicas comunes en Google STT para niños de 6 años
  const phoneticAliases = {
    'ma': ['mas', 'mar', 'mal', 'mama', 'madre', 'mano', 'mapa', 'manzana', 'maceta', 'va', 'ba', 'ama'],
    'me': ['mes', 'medio', 'mesa', 'melon', 'medusa', 'medico', 'metro', 'meme'],
    'mi': ['mi', 'miel', 'mimo', 'mil', '1000', 'mis', 'mitad', 'mira'],
    'mo': ['mono', 'momo', 'moto', 'momia', 'montana', 'modo'],
    'mu': ['muy', 'muela', 'muro', 'mundo', 'muneca', 'murcielago'],
    'pa': ['para', 'papa', 'pan', 'pato', 'paraguas', 'payaso', 'paz'],
    'pe': ['perro', 'pelota', 'pez', 'peso', 'pelo'],
    'pi': ['pino', 'pinguino', 'pizza', 'pico', 'pie'],
    'po': ['pollo', 'pozo', 'policia', 'polo', 'poco'],
    'pu': ['puerta', 'puente', 'pulpo', 'puro'],
    'sa': ['sapo', 'sandia', 'sal', 'san'],
    'se': ['serpiente', 'semaforo', 'semilla', 'seco'],
    'si': ['silla', 'sirena', 'siete', 'si'],
    'so': ['sol', 'sopa', 'sombrero', 'son'],
    'su': ['suma', 'submarino', 'sueno', 'sur', 'sube']
  };

  if (phoneticAliases[syl]) {
    for (const alias of phoneticAliases[syl]) {
      if (tokens.includes(alias) || clean.includes(alias)) {
        return true;
      }
    }
  }

  return false;
};

// ─── Componente Acompañante de Fito Interactivo ───────────────────────────────
const FitoCompanion = ({
  image,
  text,
  expressionTag,
  onSpeak,
  isSpeaking,
  mood = 'happy'
}) => {
  return (
    <div className={`fito-scene-companion mood-${mood}`}>
      <div className="fito-companion-bubble">
        {expressionTag && <span className="fito-companion-tag">{expressionTag}</span>}
        <p className="fito-companion-text">{text}</p>
        {onSpeak && (
          <button
            type="button"
            className={`fito-companion-speak-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={onSpeak}
            title="Escuchar a Fito hablar"
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isSpeaking ? 'Detener' : 'Repetir voz'}</span>
          </button>
        )}
      </div>
      <div className="fito-companion-char">
        <img
          src={image}
          alt="Fito mascota"
          className={`fito-companion-img ${isSpeaking ? 'talking-bounce' : ''} ${mood === 'excited' ? 'bounce-celebrate' : ''} ${mood === 'sad' ? 'sad-wobble' : ''}`}
        />
        <div className="fito-companion-shadow" />
      </div>
    </div>
  );
};

// ─── Partículas de confeti ────────────────────────────────────────────────────
const Confetti = () => {
  const colors = ['#FF4B4B', '#FFC800', '#58CC02', '#1CB0F6', '#CE82FF', '#FF9500'];
  const shapes = ['circle', 'square', 'triangle'];
  return (
    <div className="confetti-container" aria-hidden="true">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className={`confetti-piece confetti-${shapes[i % 3]}`}
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
            width: `${8 + Math.random() * 10}px`,
            height: `${8 + Math.random() * 10}px`,
          }}
        />
      ))}
    </div>
  );
};

// ─── Banco de palabras por nivel ──────────────────────────────────────────────
const wordBanks = {
  1: { // M
    'MA': [{ word: 'manzana', icon: '🍎' }, { word: 'mano', icon: '🖐️' }, { word: 'mariposa', icon: '🦋' }, { word: 'mapa', icon: '🗺️' }, { word: 'maceta', icon: '🪴' }],
    'ME': [{ word: 'mesa', icon: '🪑' }, { word: 'medusa', icon: '🪼' }, { word: 'melón', icon: '🍈' }, { word: 'médico', icon: '👨‍⚕️' }, { word: 'metro', icon: '📏' }],
    'MI': [{ word: 'miel', icon: '🍯' }, { word: 'micrófono', icon: '🎤' }, { word: 'mitad', icon: '🌗' }, { word: 'microondas', icon: '♨️' }, { word: 'mimo', icon: '🎭' }],
    'MO': [{ word: 'mono', icon: '🐒' }, { word: 'moño', icon: '🎀' }, { word: 'moto', icon: '🏍️' }, { word: 'momia', icon: '🧟' }, { word: 'montaña', icon: '⛰️' }],
    'MU': [{ word: 'muñeca', icon: '🎎' }, { word: 'murciélago', icon: '🦇' }, { word: 'muela', icon: '🦷' }, { word: 'muro', icon: '🧱' }, { word: 'mundo', icon: '🌍' }]
  },
  2: { // P
    'PA': [{ word: 'pato', icon: '🦆' }, { word: 'paraguas', icon: '☔' }, { word: 'payaso', icon: '🤡' }],
    'PE': [{ word: 'perro', icon: '🐶' }, { word: 'pelota', icon: '⚽' }, { word: 'pez', icon: '🐟' }],
    'PI': [{ word: 'pino', icon: '🌲' }, { word: 'pingüino', icon: '🐧' }, { word: 'pizza', icon: '🍕' }],
    'PO': [{ word: 'pollo', icon: '🐔' }, { word: 'pozo', icon: '🕳️' }, { word: 'policía', icon: '👮' }],
    'PU': [{ word: 'puerta', icon: '🚪' }, { word: 'puente', icon: '🌉' }, { word: 'pulpo', icon: '🐙' }]
  },
  3: { // S
    'SA': [{ word: 'sapo', icon: '🐸' }, { word: 'sandía', icon: '🍉' }, { word: 'sal', icon: '🧂' }],
    'SE': [{ word: 'serpiente', icon: '🐍' }, { word: 'semáforo', icon: '🚦' }, { word: 'semilla', icon: '🌱' }],
    'SI': [{ word: 'silla', icon: '🪑' }, { word: 'sirena', icon: '🧜‍♀️' }, { word: 'siete', icon: '7️⃣' }],
    'SO': [{ word: 'sol', icon: '☀️' }, { word: 'sopa', icon: '🍲' }, { word: 'sombrero', icon: '🎩' }],
    'SU': [{ word: 'suma', icon: '➕' }, { word: 'submarino', icon: '🚢' }, { word: 'sueño', icon: '💤' }]
  }
};

export const Classroom = () => {
  const { levelId, partId } = useParams();
  const navigate = useNavigate();

  const currentLevelBank = wordBanks[levelId] || wordBanks[1];
  const allWordsInLevel = Object.values(currentLevelBank).flat();

  const [phase, setPhase] = useState(parseInt(partId) || 1);
  const [phaseItems, setPhaseItems] = useState([]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [chestState, setChestState] = useState('idle');
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  const [selectedData, setSelectedData] = useState(null);
  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [clickedOption, setClickedOption] = useState(null);
  const [optionResult, setOptionResult] = useState(null);

  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');

  // ── Estados del micrófono y transcripción en vivo ────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastHeard, setLastHeard] = useState('');
  const [micError, setMicError] = useState(null);
  const [micVolume, setMicVolume] = useState(0);

  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const isEvaluatingRef = useRef(false);
  const micTimeoutRef = useRef(null);

  // ── Gestor de Audio con Exclusión Mutua Estricta (CERO Solapamiento) ─
  const audioRef = useRef(null);
  const audioAbortRef = useRef(null);
  const audioSessionIdRef = useRef(0);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

  // ── Fito estado y expresiones ────────────────────────────────────
  const [fitoMood, setFitoMood] = useState('happy');

  const getFitoImage = () => {
    switch (fitoMood) {
      case 'excited':
        return '/fito_celebrando.png';
      case 'listening':
        return '/fito_escuchando.png';
      case 'sad':
        return '/fito_triste.png';
      case 'thinking':
        return '/fito_pensando.png';
      default:
        return '/fito_feliz.png';
    }
  };

  // ─── Inicialización de ítems por fase ─────────────────────────────
  useEffect(() => {
    const shuffledSyllables = Object.keys(currentLevelBank).sort(() => Math.random() - 0.5);
    const items = shuffledSyllables.map(s => {
      const words = currentLevelBank[s];
      return { ...words[Math.floor(Math.random() * words.length)], syllable: s };
    });
    setPhaseItems(items);
    setActiveItemIndex(phase === 3 ? 0 : null);
    setLiveTranscript('');
    setLastHeard('');
    setOptionResult(null);
    setFitoMood(phase === 1 ? 'happy' : phase === 2 ? 'thinking' : 'listening');
  }, [phase, levelId]);

  // ─── DETENER TODO AUDIO INMEDIATAMENTE ────────────────────────────
  const stopAllAudio = useCallback(() => {
    // Incrementa la sesión para invalidar cualquier petición fetch en curso
    audioSessionIdRef.current++;

    if (audioAbortRef.current) {
      audioAbortRef.current.abort();
      audioAbortRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingAudio(false);
  }, []);

  // ─── SÍNTESIS NATIVA DE RESPALDO (Sin solapamiento) ───────────────
  const fallbackSpeech = useCallback((text, sessionId) => {
    if (sessionId !== audioSessionIdRef.current) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Dalia') || v.name.includes('Sabina')));
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onend = () => {
        if (sessionId === audioSessionIdRef.current) setIsSpeakingAudio(false);
      };
      utterance.onerror = () => {
        if (sessionId === audioSessionIdRef.current) setIsSpeakingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeakingAudio(false);
    }
  }, []);

  // ─── REPRODUCCIÓN DE AUDIO (Inicio rápido + Exclusión mutua) ──────
  const playAudio = useCallback(async (text) => {
    if (!text) return;

    // 1. Cortar cualquier línea de diálogo anterior de inmediato
    stopAllAudio();

    const sessionId = audioSessionIdRef.current;
    const controller = new AbortController();
    audioAbortRef.current = controller;
    setIsSpeakingAudio(true);

    try {
      const response = await fetch('http://localhost:3000/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      // Si mientras descargaba el audio se lanzó otra línea, descartar esta
      if (sessionId !== audioSessionIdRef.current) return;

      if (!response.ok) throw new Error('TTS status ' + response.status);
      const blob = await response.blob();

      if (sessionId !== audioSessionIdRef.current) return;

      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);
      audioRef.current = newAudio;

      newAudio.onended = () => {
        if (sessionId === audioSessionIdRef.current) {
          setIsSpeakingAudio(false);
          URL.revokeObjectURL(url);
        }
      };

      newAudio.onerror = () => {
        if (sessionId === audioSessionIdRef.current) {
          fallbackSpeech(text, sessionId);
        }
      };

      await newAudio.play();
    } catch (error) {
      if (error.name === 'AbortError') return; // Cancelado por una nueva línea
      if (sessionId === audioSessionIdRef.current) {
        fallbackSpeech(text, sessionId);
      }
    }
  }, [stopAllAudio, fallbackSpeech]);

  // ─── HABLA AUTOMÁTICA DE FITO (Inicio rápido con 120ms de delay) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameStatus !== 'playing') return;

      if (phase === 1 && !showOptions) {
        playAudio('¡Hola, amiguito! ¡Soy Fito! ¡Girá la ruleta mágica para ver qué sílaba nos toca jugar!');
      } else if (phase === 2 && !showOptions && chestState === 'idle') {
        playAudio('¡Guau! ¡Elegí uno de los tres cofres sorpresa para ver qué palabra misteriosa esconde!');
      } else if (phase === 3 && chestState === 'idle') {
        playAudio('¡Tocá la carta con signo de pregunta para revelarla y preparate para decir la sílaba con tu voz!');
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [phase, showOptions, chestState, gameStatus, playAudio]);

  // ─── Lógica de Rondas (Ganar / Perder) ─────────────────────────────
  const unlockNextPart = useCallback(() => {
    const unlocked = JSON.parse(localStorage.getItem('unlockedParts') || '["1-1"]');
    const nextPart = phase < 3 ? `1-${phase + 1}` : '2-1';
    if (!unlocked.includes(nextPart)) unlocked.push(nextPart);
    localStorage.setItem('unlockedParts', JSON.stringify(unlocked));
  }, [phase]);

  const handleWinRound = useCallback(() => {
    setOptionResult('correct');
    setFitoMood('excited');
    const newScore = score + 1;
    setScore(newScore);

    if (newScore >= 5) {
      unlockNextPart();
      if (phase < 3) {
        playAudio('¡Siii! ¡Qué genial! ¡Pasamos a la siguiente aventura!');
        setTimeout(() => {
          setPhase(prev => prev + 1);
          setScore(0);
          setErrors(0);
          setShowOptions(false);
          setChestState('idle');
          setActiveItemIndex(null);
          setClickedOption(null);
          setOptionResult(null);
          setLiveTranscript('');
          setLastHeard('');
          setFitoMood('happy');
        }, 1800);
      } else {
        setGameStatus('won');
        playAudio('¡Felicidades! ¡Completaste todas las partes del nivel! ¡Sos un súper campeón de la lectura!');
      }
    } else {
      playAudio('¡Siii! ¡Esa es la correcta! ¡Lo hiciste increíble!');
      if (phase === 3) {
        setTimeout(() => {
          setChestState('idle');
          setActiveItemIndex(prev => prev + 1);
          setOptionResult(null);
          setLiveTranscript('');
          setLastHeard('');
          setFitoMood('listening');
        }, 1800);
      } else {
        setTimeout(() => {
          setShowOptions(false);
          setChestState('idle');
          setActiveItemIndex(null);
          setClickedOption(null);
          setOptionResult(null);
          setFitoMood(phase === 1 ? 'happy' : 'thinking');
        }, 2200);
      }
    }
  }, [score, phase, unlockNextPart, playAudio]);

  const handleLoseRound = useCallback(() => {
    setOptionResult('incorrect');
    setFitoMood('sad');
    const newErrors = errors + 1;
    setErrors(newErrors);

    if (newErrors >= 3) {
      setGameStatus('lost');
      playAudio('¡Uuuy! Se acabaron las vidas, pero no te preocupes, ¡vamos a jugar de nuevo juntos!');
    } else {
      playAudio('¡Uuuy, casi casi! ¡No te preocupes, amiguito, probemos de nuevo!');
      if (phase < 3) {
        setTimeout(() => {
          setShowOptions(false);
          setChestState('idle');
          setActiveItemIndex(null);
          setClickedOption(null);
          setOptionResult(null);
          setFitoMood(phase === 1 ? 'happy' : 'thinking');
        }, 2200);
      } else {
        setTimeout(() => {
          setOptionResult(null);
          setFitoMood('listening');
        }, 1800);
      }
    }
  }, [errors, phase, playAudio]);

  // ─── FASE 1: RULETA ───────────────────────────────────────────────
  const spinWheel = () => {
    setIsSpinning(true);
    setShowOptions(false);
    setOptionResult(null);
    setFitoMood('excited');

    const targetWordObj = phaseItems[score];
    const targetSyllable = targetWordObj.syllable;
    const correctWord = targetWordObj;

    const validIncorrectWords = allWordsInLevel.filter(w =>
      !currentLevelBank[targetSyllable].some(cw => cw.word === w.word)
    );
    const incorrectWord = validIncorrectWords[Math.floor(Math.random() * validIncorrectWords.length)];

    setSelectedData({ syllable: targetSyllable, correct: correctWord });

    const syllables = Object.keys(currentLevelBank);
    const targetVisualIndex = syllables.indexOf(targetSyllable);
    setRotation(prev => prev + 1800 + (360 - (targetVisualIndex * 72)) - (prev % 360));

    // Giro más dinámico (2.2s en vez de 3s)
    setTimeout(() => {
      setIsSpinning(false);
      const shuffledOptions = [correctWord, incorrectWord].sort(() => Math.random() - 0.5);
      setOptions(shuffledOptions);
      setShowOptions(true);
      setFitoMood('thinking');
      playAudio(`¿Qué palabra comienza con la sílaba ${targetSyllable}? ¿${shuffledOptions[0].word}, o ${shuffledOptions[1].word}? ¡Tocá la correcta!`);
    }, 2200);
  };

  // ─── FASE 2: COFRES ───────────────────────────────────────────────
  const handleChestClick = (index) => {
    if (chestState !== 'idle') return;
    setActiveItemIndex(index);
    setChestState('shaking');
    setOptionResult(null);
    setFitoMood('excited');

    const targetWordObj = phaseItems[score];
    const targetSyllable = targetWordObj.syllable;
    const otherSyllables = Object.keys(currentLevelBank).filter(s => s !== targetSyllable);
    const incorrectSyllable = otherSyllables[Math.floor(Math.random() * otherSyllables.length)];

    setSelectedData({ wordObj: targetWordObj, correct: targetSyllable });
    const shuffledOptions = [targetSyllable, incorrectSyllable].sort(() => Math.random() - 0.5);
    setOptions(shuffledOptions);

    // Apertura más veloz para inicio rápido de la consigna
    setTimeout(() => {
      setChestState('opened');
      setTimeout(() => {
        setShowOptions(true);
        setFitoMood('thinking');
        // Pista fonológica sin revelar la respuesta: pregunta por la palabra y acentúa
        const emphasis = createPhoneticSyllableEmphasis(targetWordObj.word, targetSyllable);
        playAudio(`¿Cómo empieza la palabra... ${emphasis}? ¿Con ${shuffledOptions[0]}, o con ${shuffledOptions[1]}? ¡Elegí la correcta!`);
      }, 500);
    }, 600);
  };

  // ─── FASE 3: CARTAS ───────────────────────────────────────────────
  const flipCard = () => {
    const targetWordObj = phaseItems[activeItemIndex];
    const targetSyllable = targetWordObj.syllable;
    setSelectedData({ wordObj: targetWordObj, correct: targetSyllable });
    setChestState('opened');
    setLiveTranscript('');
    setLastHeard('');
    currentTranscriptRef.current = '';
    setFitoMood('listening');
    // Consigna directa
    playAudio(`¿Con qué sílaba comienza ${targetWordObj.word}? ¡Tocá el micrófono rojo y decímela bien fuerte! ¡Te escucho!`);
  };

  // ─── LIMPIAR STREAMS DE AUDIO ────────────────────────────────────
  const stopMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setMicVolume(0);
  };

  // ─── MICRÓFONO CORREGIDO ─────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      stopMediaTracks();
      setIsRecording(false);
      return;
    }

    // Cortar de inmediato cualquier audio que esté sonando
    stopAllAudio();

    setMicError(null);
    setLiveTranscript('');
    currentTranscriptRef.current = '';
    isEvaluatingRef.current = false;

    let userAudioStream = null;
    try {
      userAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = userAudioStream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(userAudioStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!mediaStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(checkVolume);
        };
        requestAnimationFrame(checkVolume);
      }
    } catch (permErr) {
      console.error('Permiso de micrófono denegado:', permErr);
      setMicError('El navegador bloqueó el micrófono. Habilita los permisos arriba a la izquierda 🔒');
      playAudio('El micrófono está bloqueado. Pídele ayuda a un adulto para activar los permisos.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Navegador sin soporte de voz. Usa Google Chrome o Microsoft Edge.');
      playAudio('Tu navegador no soporta voz. Intenta usar Google Chrome.');
      stopMediaTracks();
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsRecording(true);
      setIsProcessingVoice(false);
      setFitoMood('listening');

      if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && !isEvaluatingRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      }, 8000);
    };

    recognition.onresult = (event) => {
      if (isEvaluatingRef.current) return;

      let interim = '';
      const allTranscripts = [];

      for (let i = 0; i < event.results.length; ++i) {
        interim += event.results[i][0].transcript + ' ';
        for (let j = 0; j < event.results[i].length; j++) {
          allTranscripts.push(event.results[i][j].transcript);
        }
      }

      interim = interim.trim();
      if (interim) {
        currentTranscriptRef.current = interim;
        setLiveTranscript(interim);
        setLastHeard(interim);
      }

      const targetItem = phaseItems[activeItemIndex];
      const targetSyllable = targetItem?.syllable;
      const targetWord = targetItem?.word;

      const isMatch = allTranscripts.some(t => checkSyllableMatch(t, targetSyllable, targetWord)) ||
                      checkSyllableMatch(interim, targetSyllable, targetWord);

      if (isMatch) {
        console.log('✅ Coincidencia de voz detectada en vivo:', interim);
        isEvaluatingRef.current = true;
        if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);
        try { recognition.stop(); } catch (e) {}
        stopMediaTracks();
        setIsRecording(false);
        setIsProcessingVoice(false);
        handleWinRound();
      }
    };

    recognition.onerror = (event) => {
      if (isEvaluatingRef.current) return;
      console.warn('SpeechRecognition error:', event.error);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsRecording(false);
        setIsProcessingVoice(false);
        stopMediaTracks();
        setMicError('Permiso de micrófono no otorgado en el navegador.');
      } else if (event.error === 'network') {
        setMicError('Error de red con el reconocimiento. Verifica tu conexión a internet.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      stopMediaTracks();
      if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);

      if (!isEvaluatingRef.current) {
        const targetItem = phaseItems[activeItemIndex];
        const targetSyllable = targetItem?.syllable;
        const targetWord = targetItem?.word;
        const captured = currentTranscriptRef.current;

        if (captured) {
          const isMatch = checkSyllableMatch(captured, targetSyllable, targetWord);
          if (isMatch) {
            isEvaluatingRef.current = true;
            handleWinRound();
            return;
          }
          handleLoseRound();
        } else {
          setFitoMood('sad');
          playAudio('No escuché nada. ¡Tocá el micrófono y decí la sílaba con voz fuerte!');
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsRecording(false);
      stopMediaTracks();
      setMicError('No se pudo activar el micrófono. Intenta de nuevo.');
    }
  }, [isRecording, phaseItems, activeItemIndex, handleWinRound, handleLoseRound, playAudio, stopAllAudio]);

  const handleOptionClick = (option, index) => {
    if (clickedOption !== null) return;
    setClickedOption(index);
    const isCorrect = phase === 1 ? option.word === selectedData.correct.word : option === selectedData.correct;
    if (isCorrect) handleWinRound(); else handleLoseRound();
  };

  const resetGame = () => {
    stopAllAudio();
    setScore(0);
    setErrors(0);
    setGameStatus('playing');
    setShowOptions(false);
    setChestState('idle');
    setActiveItemIndex(phase === 3 ? 0 : null);
    setClickedOption(null);
    setOptionResult(null);
    setLiveTranscript('');
    setLastHeard('');
    currentTranscriptRef.current = '';
    setFitoMood('happy');
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      stopMediaTracks();
      if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);
    };
  }, [stopAllAudio]);

  // ─── Textos de instrucción por fase ──────────────────────────────
  const phaseInstructions = {
    1: '🎡 ¡Girá la ruleta y encontrá la palabra correcta!',
    2: '🎁 ¡Elegí un cofre sorpresa y descubrí la sílaba!',
    3: '🃏 ¡Tocá la carta y decí la sílaba en voz alta!',
  };

  return (
    <div className="classroom-screen">
      {/* Fondo decorativo */}
      <div className="bg-bubbles" aria-hidden="true">
        {[...Array(6)].map((_, i) => <div key={i} className={`bubble bubble-${i + 1}`} />)}
      </div>

      {/* HUD Superior */}
      <div className="hud-container">
        <div className="score-box" title="Estrellas ganadas">
          {[...Array(5)].map((_, i) => (
            <Star
              key={`s-${i}`}
              size={30}
              fill={i < score ? '#FFC800' : 'transparent'}
              color={i < score ? '#FFC800' : '#D2DAE2'}
              className={i === score - 1 && score > 0 ? 'star-pop' : ''}
            />
          ))}
        </div>

        {/* Avatar Fito Mascota en el HUD */}
        <div className={`fito-hud fito-${fitoMood}`}>
          <div className="fito-avatar-wrapper">
            <img
              src={getFitoImage()}
              alt="Fito mascota"
              className="fito-hud-img"
            />
          </div>
        </div>

        <div className="errors-box" title="Vidas restantes">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={`e-${i}`}
              size={30}
              fill={i < (3 - errors) ? '#FF4B4B' : 'transparent'}
              color={i < (3 - errors) ? '#FF4B4B' : '#D2DAE2'}
            />
          ))}
        </div>
      </div>

      {/* Botón volver */}
      <button className="back-btn-class" onClick={() => navigate('/levels')} aria-label="Volver al mapa">
        <ArrowLeft size={36} />
      </button>

      {gameStatus === 'playing' && (
        <>
          {/* Título de fase */}
          <div className="phase-header">
            <div className="phase-badge">Nivel {levelId} • Parte {phase}/3</div>
            <p className="phase-instruction">{phaseInstructions[phase]}</p>
          </div>

          {/* =========================================================
              FASE 1: RULETA
              ========================================================= */}
          {phase === 1 && (
            <div className="game-stage-row">
              {!showOptions ? (
                <>
                  <div className="wheel-section">
                    <div className="wheel-wrapper">
                      <div className="wheel-pointer">▼</div>
                      <div
                        className="wheel"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          transition: isSpinning ? 'transform 2.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                        }}
                      >
                        {Object.keys(currentLevelBank).map((syllable, index) => (
                          <div
                            key={syllable}
                            className={`wheel-slice wheel-slice-${index}`}
                            style={{ transform: `rotate(${index * 72}deg)` }}
                          >
                            <span className="syllable-text">{syllable}</span>
                          </div>
                        ))}
                      </div>
                      <div className="wheel-center">🐾</div>
                    </div>

                    <button className="spin-btn" onClick={spinWheel} disabled={isSpinning}>
                      <RefreshCw size={32} className={isSpinning ? 'spin-anim' : ''} />
                      {isSpinning ? '¡Girando!' : '¡Girar Ruleta!'}
                    </button>
                  </div>

                  <FitoCompanion
                    image="/fito_feliz.png"
                    expressionTag="¡Momento previo!"
                    text="¡Hola! Tocá el botón verde para hacer girar la ruleta y descubrir qué sílaba nos toca jugar."
                    onSpeak={() => playAudio('Hola. Tocá el botón verde para hacer girar la ruleta y descubrir qué sílaba nos toca jugar.')}
                    isSpeaking={isSpeakingAudio}
                    mood="happy"
                  />
                </>
              ) : (
                <>
                  <div className="options-section">
                    <div className="target-display">
                      <div className="syllable-card">
                        <h2 className="big-syllable">{selectedData.syllable}</h2>
                        <p className="syllable-hint">¿Qué palabra empieza así?</p>
                      </div>
                    </div>

                    <div className="cards-wrapper">
                      {options.map((opt, i) => {
                        const isClicked = clickedOption === i;
                        let cardClass = 'option-card';
                        if (clickedOption !== null && !isClicked) cardClass += ' disabled-option';
                        if (isClicked && optionResult === 'correct') cardClass += ' correct-option';
                        if (isClicked && optionResult === 'incorrect') cardClass += ' incorrect-option';

                        return (
                          <button
                            key={i}
                            id={`option-${i}`}
                            className={cardClass}
                            onClick={() => handleOptionClick(opt, i)}
                            disabled={clickedOption !== null}
                          >
                            <WordImage wordObj={opt} className="option-icon" />
                            <span className="option-word">{opt.word.toUpperCase()}</span>
                            {isClicked && optionResult === 'correct' && <CheckCircle className="result-icon" size={32} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FitoCompanion
                    image={
                      optionResult === 'correct' ? '/fito_celebrando.png' :
                      optionResult === 'incorrect' ? '/fito_triste.png' :
                      '/fito_pensando.png'
                    }
                    expressionTag={
                      optionResult === 'correct' ? '¡Acierto! 🎉' :
                      optionResult === 'incorrect' ? '¡Ánimo! 🐾' :
                      '¿Cuál será?'
                    }
                    text={
                      optionResult === 'correct' ? `¡Bien hecho! ${selectedData?.correct?.word?.toUpperCase()} comienza con ${selectedData?.syllable}!` :
                      optionResult === 'incorrect' ? '¡Esa no era! No te preocupes, volvamos a intentarlo.' :
                      `¿Qué palabra comienza con ${selectedData?.syllable}? ¡Elegí la correcta!`
                    }
                    onSpeak={() => playAudio(
                      optionResult === 'correct' ? `Bien hecho. Esa palabra comienza con ${selectedData?.syllable}` :
                      optionResult === 'incorrect' ? 'Esa no era. No te preocupes, volvamos a intentarlo.' :
                      `¿Qué palabra comienza con la sílaba ${selectedData?.syllable}? ¡Tocá la tarjeta correcta!`
                    )}
                    isSpeaking={isSpeakingAudio}
                    mood={optionResult === 'correct' ? 'excited' : optionResult === 'incorrect' ? 'sad' : 'thinking'}
                  />
                </>
              )}
            </div>
          )}

          {/* =========================================================
              FASE 2: COFRES
              ========================================================= */}
          {phase === 2 && (
            <div className="game-stage-row">
              {!showOptions ? (
                <>
                  <div className="chests-section">
                    <h2 className="chests-instruction">
                      {chestState === 'idle' ? '¡Elegí un cofre misterioso!' : '¡Veamos qué esconde!'}
                    </h2>
                    <div className="chests-container">
                      {[0, 1, 2].map(index => {
                        const isActive = activeItemIndex === index;
                        const isShaking = isActive && chestState === 'shaking';
                        const isOpened = isActive && chestState === 'opened';
                        const isDisabled = chestState !== 'idle' && !isActive;

                        return (
                          <div
                            key={index}
                            className={`chest ${isShaking ? 'shaking' : ''} ${isOpened ? 'opened' : ''} ${isDisabled ? 'disabled-chest' : ''}`}
                            onClick={() => handleChestClick(index)}
                            role="button"
                            aria-label={`Cofre ${index + 1}`}
                          >
                            {isOpened && selectedData?.wordObj ? (
                              <WordImage wordObj={selectedData.wordObj} className="target-icon-large" />
                            ) : (
                              <div className="chest-visual">
                                <div className="chest-lid" />
                                <div className="chest-body">
                                  <span className="chest-lock">🔒</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <FitoCompanion
                    image="/fito_pensando.png"
                    expressionTag="¡Cofres Mágicos!"
                    text="¡Tocá cualquiera de los 3 cofres para abrirlo y descubrir qué palabra misteriosa tiene adentro!"
                    onSpeak={() => playAudio('Tocá cualquiera de los tres cofres para abrirlo y descubrir qué palabra misteriosa tiene adentro.')}
                    isSpeaking={isSpeakingAudio}
                    mood="thinking"
                  />
                </>
              ) : (
                <>
                  <div className="options-section">
                    <div className="target-display">
                      <div className="target-word">
                        <WordImage wordObj={selectedData.wordObj} className="target-icon-large" />
                        <h2 className="target-word-text">{selectedData.wordObj.word.toUpperCase()}</h2>
                        <p className="syllable-hint">¿Con qué sílaba empieza?</p>
                      </div>
                    </div>

                    <div className="cards-wrapper">
                      {options.map((opt, i) => {
                        const isClicked = clickedOption === i;
                        let cardClass = 'option-card';
                        if (clickedOption !== null && !isClicked) cardClass += ' disabled-option';
                        if (isClicked && optionResult === 'correct') cardClass += ' correct-option';
                        if (isClicked && optionResult === 'incorrect') cardClass += ' incorrect-option';

                        return (
                          <button
                            key={i}
                            id={`option-${i}`}
                            className={cardClass}
                            onClick={() => handleOptionClick(opt, i)}
                            disabled={clickedOption !== null}
                          >
                            <span className="option-syllable-large">{opt}</span>
                            {isClicked && optionResult === 'correct' && <CheckCircle className="result-icon" size={32} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FitoCompanion
                    image={
                      optionResult === 'correct' ? '/fito_celebrando.png' :
                      optionResult === 'incorrect' ? '/fito_triste.png' :
                      '/fito_pensando.png'
                    }
                    expressionTag={
                      optionResult === 'correct' ? '¡Qué alegría! 🎉' :
                      optionResult === 'incorrect' ? '¡No pasa nada! 🐾' :
                      '¡Pensá bien!'
                    }
                    text={
                      optionResult === 'correct' ? `¡Fantástico! ${selectedData?.wordObj?.word?.toUpperCase()} comienza con la sílaba ${selectedData?.correct}!` :
                      optionResult === 'incorrect' ? '¡Esa no es la correcta! Tranquilo, el próximo intento será tuyo.' :
                      `¿Con qué sílaba empieza ${selectedData?.wordObj?.word?.toUpperCase()}? ¡Tocá la tarjeta!`
                    }
                    onSpeak={() => {
                      if (optionResult === 'correct') {
                        playAudio(`¡Fantástico! Comienza con la sílaba ${selectedData?.correct}!`);
                      } else if (optionResult === 'incorrect') {
                        playAudio('Esa no es la correcta. Tranquilo, el próximo intento será tuyo.');
                      } else {
                        // Pista fonológica sin decir la respuesta: acentúa el principio
                        const emphasis = createPhoneticSyllableEmphasis(selectedData?.wordObj?.word, selectedData?.correct);
                        playAudio(`¿Cómo empieza la palabra... ${emphasis}? ¡Prestá atención al primer sonido y tocá la tarjeta!`);
                      }
                    }}
                    isSpeaking={isSpeakingAudio}
                    mood={optionResult === 'correct' ? 'excited' : optionResult === 'incorrect' ? 'sad' : 'thinking'}
                  />
                </>
              )}
            </div>
          )}

          {/* =========================================================
              FASE 3: CARTAS Y MICRÓFONO CORREGIDO
              ========================================================= */}
          {phase === 3 && (
            <div className="game-stage-row">
              <div className="cards-voice-section">
                <div className="deck-container">
                  {phaseItems.map((item, index) => {
                    const isActive = index === activeItemIndex;
                    const isDone = index < activeItemIndex;
                    const isFlipped = isActive && chestState === 'opened';

                    return (
                      <div
                        key={index}
                        className={`card-scene ${isDone ? 'done-card' : ''}`}
                        onClick={() => { if (isActive && chestState === 'idle') flipCard(); }}
                      >
                        <div className={`playing-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                          <div className="card-back">
                            {isActive && !isFlipped && <span className="card-tap-hint">👆</span>}
                            <span>❓</span>
                          </div>
                          <div className={`card-front ${optionResult === 'correct' && isActive ? 'card-correct' : ''} ${optionResult === 'incorrect' && isActive ? 'card-incorrect' : ''}`}>
                            <WordImage wordObj={item} className="card-icon" />
                            <span className="card-word">{item.word.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {chestState === 'opened' && (
                  <div className="mic-interactive-box">
                    {micError && (
                      <div className="mic-error-msg">
                        <MicOff size={20} />
                        <span>{micError}</span>
                      </div>
                    )}

                    <button
                      id="mic-toggle-btn"
                      className={`mic-btn ${isRecording ? 'recording' : ''} ${isProcessingVoice ? 'processing' : ''}`}
                      onClick={toggleRecording}
                      disabled={isProcessingVoice}
                      aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
                    >
                      {isProcessingVoice
                        ? <span className="mic-spinner">⏳</span>
                        : isRecording
                          ? <MicOff size={48} color="white" />
                          : <Mic size={48} color="white" />
                      }
                    </button>

                    <p className="mic-label">
                      {isProcessingVoice
                        ? 'Analizando...'
                        : isRecording
                          ? '¡Tocá para parar o decí la sílaba!'
                          : 'Tocá el micro y hablá'}
                    </p>

                    {/* Medidor visual de volumen del micrófono en tiempo real */}
                    {isRecording && (
                      <div className="mic-volume-meter-container" title="Nivel de voz">
                        <div
                          className="mic-volume-bar"
                          style={{ width: `${Math.max(12, micVolume)}%` }}
                        />
                        <span className="mic-volume-text">
                          {micVolume > 15 ? '🎤 ¡Detectando tu voz!' : '🎤 Hablá al micrófono...'}
                        </span>
                      </div>
                    )}

                    {/* Transcripción en vivo */}
                    {liveTranscript && (
                      <div className="live-transcript-badge">
                        <span>🗣️ Escuchando: <strong>"{liveTranscript}"</strong></span>
                      </div>
                    )}

                    {/* Botón pista de sonido fonológica (sin decir la respuesta) */}
                    <div className="mic-aux-buttons">
                      <button
                        type="button"
                        className="sound-hint-btn"
                        onClick={() => {
                          const currentItem = phaseItems[activeItemIndex];
                          const emphasis = createPhoneticSyllableEmphasis(currentItem?.word, currentItem?.syllable);
                          playAudio(`¿Cómo empieza la palabra... ${emphasis}? ¡Prestá mucha atención al sonido del comienzo!`);
                        }}
                        title="Escuchar pista con pronunciación fonética acentuada"
                      >
                        <Volume2 size={16} />
                        <span>Pista: ¿Cómo suena?</span>
                      </button>

                      <button
                        type="button"
                        className="skip-fallback-btn"
                        onClick={() => handleWinRound()}
                        title="Validar acierto si tu micrófono no funciona"
                      >
                        <Sparkles size={16} />
                        <span>¡Lo dije bien!</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fito al lado en Fase 3 */}
              <FitoCompanion
                image={
                  optionResult === 'correct' ? '/fito_celebrando.png' :
                  optionResult === 'incorrect' ? '/fito_triste.png' :
                  isRecording ? '/fito_escuchando.png' :
                  chestState === 'opened' ? '/fito_escuchando.png' :
                  '/fito_feliz.png'
                }
                expressionTag={
                  optionResult === 'correct' ? '¡Qué bien hablás! 🎉' :
                  optionResult === 'incorrect' ? '¡A no desanimarse! 🐾' :
                  isRecording ? '¡Te escucho! 👂' :
                  chestState === 'opened' ? '¡Tu turno de hablar!' :
                  '¡Momento de cartas!'
                }
                text={
                  optionResult === 'correct' ? `¡Increíble pronunciación! ¡Dijiste la sílaba correcta!` :
                  optionResult === 'incorrect' ? 'No escuché la sílaba correcta. ¡Probá decirla bien fuerte y claro!' :
                  isRecording ? (liveTranscript ? `Escuché: "${liveTranscript}"` : '¡Decí la sílaba con voz clara!') :
                  chestState === 'opened' ? `Tocá el micrófono rojo y decí con qué sílaba empieza ${phaseItems[activeItemIndex]?.word?.toUpperCase()}` :
                  'Tocá la carta con el signo de pregunta para revelarla y ver qué palabra te toca pronunciar.'
                }
                onSpeak={() => {
                  if (optionResult === 'correct') {
                    playAudio('¡Increíble pronunciación! ¡Dijiste la sílaba correcta!');
                  } else if (optionResult === 'incorrect') {
                    playAudio('No escuché la sílaba correcta. Probá decirla bien fuerte y claro.');
                  } else if (chestState === 'opened') {
                    const currentItem = phaseItems[activeItemIndex];
                    const emphasis = createPhoneticSyllableEmphasis(currentItem?.word, currentItem?.syllable);
                    playAudio(`¿Cómo empieza la palabra... ${emphasis}? ¡Tocá el micrófono rojo y decímela bien fuerte!`);
                  } else {
                    playAudio('Tocá la carta con el signo de pregunta para revelarla.');
                  }
                }}
                isSpeaking={isSpeakingAudio}
                mood={
                  optionResult === 'correct' ? 'excited' :
                  optionResult === 'incorrect' ? 'sad' :
                  isRecording || chestState === 'opened' ? 'listening' :
                  'happy'
                }
              />
            </div>
          )}
        </>
      )}

      {/* ── OVERLAY: GANASTE ── */}
      {gameStatus === 'won' && (
        <div className="overlay-screen won-screen">
          <Confetti />
          <div className="won-content">
            <img
              src="/fito_celebrando.png"
              alt="Fito celebrando"
              className="fito-overlay-img bounce-anim"
            />
            <Star size={70} fill="#FFC800" color="#F49000" className="star-bounce" />
            <h1>¡Nivel Completado!</h1>
            <p className="overlay-subtitle">¡Fito está súper orgulloso de tu avance! 🦴</p>
            <button className="action-btn success-btn" onClick={() => navigate('/levels')}>
              <Map size={28} /> Volver al Mapa
            </button>
          </div>
        </div>
      )}

      {/* ── OVERLAY: PERDISTE ── */}
      {gameStatus === 'lost' && (
        <div className="overlay-screen lost-screen">
          <div className="lost-content">
            <img
              src="/fito_triste.png"
              alt="Fito triste"
              className="fito-overlay-img fito-shake"
            />
            <h1>¡Casi lo lográs!</h1>
            <p className="overlay-subtitle">¡Fito sabe que en el próximo intento lo conseguirás! 💪</p>
            <button className="action-btn retry-btn" onClick={resetGame}>
              <RotateCcw size={28} /> ¡Reintentar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};