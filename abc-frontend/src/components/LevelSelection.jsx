import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, PlayCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import './LevelSelection.css';

export const LevelSelection = () => {
  const navigate = useNavigate();
  const [speakingLevelId, setSpeakingLevelId] = useState(null);
  const audioRef = useRef(null);

  // Leemos las partes desbloqueadas. Por defecto, solo la Parte 1 del Nivel 1 está disponible.
  const unlockedParts = JSON.parse(localStorage.getItem('unlockedParts') || '["1-1"]');

  const levels = [
    { 
      id: 1, 
      title: 'Sílabas con M', 
      parts: [
        { id: 1, name: 'La Ruleta (Sílaba a Palabra)' },
        { id: 2, name: 'Los Cofres (Palabra a Sílaba)' },
        { id: 3, name: 'Las Cartas (¡Usa tu Voz!)' }
      ],
      mascot: {
        image: '/fito_feliz.png',
        alt: 'Fito feliz saludando',
        expression: '¡Hola, amiguito!',
        text: '¡Hola! Soy Fito. En este nivel aprenderemos las sílabas con la letra M: ma, me, mi, mo y mu. ¡Toca una parte para empezar a jugar!'
      }
    },
    { 
      id: 2, 
      title: 'Sílabas con P', 
      parts: [
        { id: 1, name: 'La Ruleta (Sílaba a Palabra)' },
        { id: 2, name: 'Los Cofres (Palabra a Sílaba)' },
        { id: 3, name: 'Las Cartas (¡Usa tu Voz!)' }
      ],
      mascot: {
        image: '/fito_pensando.png',
        alt: 'Fito pensando y curioso',
        expression: '¡Desafío con P!',
        text: '¡Guau! En este nivel practicaremos la letra P: pa, pe, pi, po y pu. ¿Te animas a descubrir qué palabras se esconden?'
      }
    },
    { 
      id: 3, 
      title: 'Sílabas con S', 
      parts: [
        { id: 1, name: 'La Ruleta (Sílaba a Palabra)' },
        { id: 2, name: 'Los Cofres (Palabra a Sílaba)' },
        { id: 3, name: 'Las Cartas (¡Usa tu Voz!)' }
      ],
      mascot: {
        image: '/fito_celebrando.png',
        alt: 'Fito celebrando con alegría',
        expression: '¡Súper lector!',
        text: '¡Increíble avance! Con la letra S: sa, se, si, so y su, ¡te convertirás en un maestro de la lectura! ¡Usa tu voz para ganar!'
      }
    },
    {
      id: 4,
      title: 'Palabras Completas (Pronto)',
      isComingSoon: true,
      parts: [
        { id: 1, name: 'Lectura con Imagen' },
        { id: 2, name: 'Construcción de Palabra' }
      ],
      mascot: {
        image: '/fito_escuchando.png',
        alt: 'Fito escuchando con atención',
        expression: '¡Próximo mundo!',
        text: '¡Muy pronto! Aquí aprenderemos a leer palabras completas como pato y sol. ¡Sigue practicando para desbloquearlo!'
      }
    }
  ];

  // ── Reproducción de voz de Fito (TTS con fallback nativo) ──────
  const speakMascot = async (levelId, text) => {
    // Si ya está hablando en este nivel, pausar
    if (speakingLevelId === levelId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingLevelId(null);
      return;
    }

    // Detener cualquier audio previo
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setSpeakingLevelId(levelId);

    // 1. Intentar con el backend de Google TTS
    try {
      const response = await fetch('http://localhost:3000/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('TTS status ' + response.status);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setSpeakingLevelId(null);
      };
      audio.onerror = () => {
        useSpeechSynthesisFallback(text, () => setSpeakingLevelId(null));
      };

      await audio.play();
    } catch (err) {
      console.warn('Backend TTS no disponible, usando síntesis nativa del navegador:', err);
      useSpeechSynthesisFallback(text, () => setSpeakingLevelId(null));
    }
  };

  const useSpeechSynthesisFallback = (text, onEnd) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = 0.95;
    utterance.pitch = 1.1; // tono un poco más amigable y agudo para Fito
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="levels-screen">
      {/* Fondo con burbujas decorativas */}
      <div className="levels-bg-bubbles" aria-hidden="true">
        <div className="bubble-l bubble-l1" />
        <div className="bubble-l bubble-l2" />
        <div className="bubble-l bubble-l3" />
      </div>

      <button className="back-btn" onClick={() => navigate('/')} aria-label="Volver al inicio">
        <ArrowLeft size={36} />
      </button>

      <div className="levels-header">
        <h1 className="levels-title">
          <span>Aventura con Fito</span> 🐾
        </h1>
        <p className="levels-subtitle">¡Elige un nivel y aprende a leer jugando!</p>
      </div>

      <div className="levels-path">
        {levels.map((level, index) => {
          // Un nivel está desbloqueado si su primera parte lo está (o si no es comingSoon)
          const isLevelUnlocked = !level.isComingSoon && unlockedParts.includes(`${level.id}-1`);
          const isSpeaking = speakingLevelId === level.id;

          return (
            <div key={level.id} className="level-row-wrapper">
              {/* Tarjeta del Nivel a la izquierda */}
              <div className={`level-node ${isLevelUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="level-circle">
                  {isLevelUnlocked ? <Unlock size={44} color="white" /> : <Lock size={44} color="white" />}
                </div>
                
                <div className="level-info">
                  <div className="level-title-row">
                    <h2>Nivel {level.id}</h2>
                    {isLevelUnlocked && <span className="unlocked-badge"><Sparkles size={14} /> Activo</span>}
                  </div>
                  <p className="level-desc">{level.title}</p>
                  
                  {/* Mostramos las partes si el nivel está desbloqueado */}
                  {isLevelUnlocked ? (
                    <div className="parts-container">
                      {level.parts.map(part => {
                        const partKey = `${level.id}-${part.id}`;
                        const isPartUnlocked = unlockedParts.includes(partKey);
                        
                        return (
                          <button 
                            key={part.id}
                            className={`part-btn ${isPartUnlocked ? 'part-unlocked' : 'part-locked'}`}
                            onClick={() => isPartUnlocked && navigate(`/class/${level.id}/${part.id}`)}
                            disabled={!isPartUnlocked}
                          >
                            {isPartUnlocked ? <PlayCircle size={20} /> : <Lock size={18} />}
                            <span>Parte {part.id}: {part.name.split('(')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="locked-level-notice">
                      <span>{level.isComingSoon ? '🚀 Próximamente' : '🔒 Completa el nivel anterior para desbloquear'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mascota Fito a la derecha de cada nivel */}
              <div className={`level-mascot-container ${isSpeaking ? 'is-talking' : ''}`}>
                <div className="mascot-speech-bubble">
                  <div className="mascot-tag">{level.mascot.expression}</div>
                  <p className="mascot-speech-text">{level.mascot.text}</p>
                  
                  <button
                    className={`mascot-listen-btn ${isSpeaking ? 'btn-speaking' : ''}`}
                    onClick={() => speakMascot(level.id, level.mascot.text)}
                    aria-label="Escuchar a Fito hablar"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={18} />
                        <span>Detener voz</span>
                        <div className="sound-wave-mini">
                          <span className="sw-bar b1" />
                          <span className="sw-bar b2" />
                          <span className="sw-bar b3" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Volume2 size={18} />
                        <span>¡Escuchar a Fito!</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mascot-character-wrapper">
                  <img
                    src={level.mascot.image}
                    alt={level.mascot.alt}
                    className={`mascot-avatar-img ${isSpeaking ? 'talking-bounce' : ''}`}
                  />
                  <div className="mascot-shadow" />
                </div>
              </div>

              {/* Línea conectora hacia el siguiente nivel */}
              {index < levels.length - 1 && <div className={`path-connector ${isLevelUnlocked ? 'connector-unlocked' : ''}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};