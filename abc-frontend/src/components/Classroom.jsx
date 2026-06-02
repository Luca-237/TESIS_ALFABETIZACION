import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Star, XCircle, RotateCcw, Map, Mic } from 'lucide-react';
import './Classroom.css';

const syllablePool = {
  'MA': [{ word: 'manzana', icon: '🍎' }, { word: 'mano', icon: '🖐️' }, { word: 'mariposa', icon: '🦋' }],
  'ME': [{ word: 'mesa', icon: '🪑' }, { word: 'medusa', icon: '🪼' }, { word: 'melón', icon: '🍈' }],
  'MI': [{ word: 'miel', icon: '🍯' }, { word: 'micrófono', icon: '🎤' }, { word: 'mitad', icon: '🌗' }],
  'MO': [{ word: 'mono', icon: '🐒' }, { word: 'moño', icon: '🎀' }, { word: 'moto', icon: '🏍️' }],
  'MU': [{ word: 'muñeca', icon: '🎎' }, { word: 'murciélago', icon: '🦇' }, { word: 'muela', icon: '🦷' }]
};

const allWords = Object.values(syllablePool).flat();

export const Classroom = () => {
  // Ahora capturamos también el partId desde la URL
  const { levelId, partId } = useParams();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState(parseInt(partId) || 1);
  const [phaseItems, setPhaseItems] = useState([]);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const [chestState, setChestState] = useState('idle');
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  const [selectedData, setSelectedData] = useState(null);
  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); 
  
  // Estados para el Micrófono (Fase 3)
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const audioRef = useRef(null);

  // Inicialización de datos según la fase
  useEffect(() => {
    if (phase === 2 || phase === 3) {
      const items = Object.keys(syllablePool).map(s => {
        const words = syllablePool[s];
        return { ...words[Math.floor(Math.random() * words.length)], syllable: s };
      }).sort(() => Math.random() - 0.5); // Mezclamos los 5 ítems
      setPhaseItems(items);
      setActiveItemIndex(phase === 3 ? 0 : null); // En Fase 3 empezamos con la carta 0
    }
  }, [phase]);

  const playAudio = async (text) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    try {
      const response = await fetch('http://localhost:3000/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      newAudio.play();
    } catch (error) {
      console.error("Error TTS:", error);
    }
  };

  // --- LÓGICA DE FASE 1 (RULETA) ---
  const spinWheel = () => {
    setIsSpinning(true);
    setShowOptions(false);
    
    const syllables = Object.keys(syllablePool);
    const randomSyllableIndex = Math.floor(Math.random() * syllables.length);
    const targetSyllable = syllables[randomSyllableIndex];
    const correctWord = syllablePool[targetSyllable][0];
    const incorrectWord = allWords.filter(w => w.word !== correctWord.word)[Math.floor(Math.random() * (allWords.length - 1))];

    setSelectedData({ syllable: targetSyllable, correct: correctWord });
    setRotation(prev => prev + 1800 + (360 - (randomSyllableIndex * 72)) - (prev % 360)); 

    setTimeout(() => {
      setIsSpinning(false);
      const shuffledOptions = [correctWord, incorrectWord].sort(() => Math.random() - 0.5);
      setOptions(shuffledOptions);
      setShowOptions(true);
      playAudio(`¿Qué palabra comienza con ${targetSyllable}?`);
    }, 3000);
  };

  // --- LÓGICA DE FASE 2 (COFRES) ---
  const handleChestClick = (index) => {
    if (chestState !== 'idle') return;
    setActiveItemIndex(index);
    setChestState('shaking');

    const targetWordObj = phaseItems[index];
    const targetSyllable = targetWordObj.syllable;
    const incorrectSyllable = Object.keys(syllablePool).find(s => s !== targetSyllable);

    setSelectedData({ wordObj: targetWordObj, correct: targetSyllable });
    setOptions([targetSyllable, incorrectSyllable].sort(() => Math.random() - 0.5));

    setTimeout(() => {
      setChestState('opened');
      setTimeout(() => {
        setShowOptions(true);
        playAudio(`¿Con qué sílaba comienza ${targetWordObj.word}?`);
      }, 1500);
    }, 1000);
  };

  // --- LÓGICA DE FASE 3 (CARTAS Y VOZ) ---
const flipCard = () => {
    const targetWordObj = phaseItems[activeItemIndex];
    const targetSyllable = targetWordObj.syllable; // <-- Faltaba declarar esta línea
    
    setSelectedData({ wordObj: targetWordObj, correct: targetSyllable });
    setChestState('opened'); 
    playAudio(`¿Con qué sílaba comienza ${targetWordObj.word}? Mantén presionado el micrófono y dímelo.`);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = processVoiceInput;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accediendo al micrófono:", err);
      playAudio("No pude escuchar tu micrófono. Por favor, dale permiso a Fito.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
    }
  };

  const processVoiceInput = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const res = await fetch('http://localhost:3000/api/voice/listen', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setIsProcessingVoice(false);
      
      const recognizedText = data.text.toLowerCase();
      const expectedSyllable = phaseItems[activeItemIndex].syllable.toLowerCase();
      
      // Verificamos si Vosk entendió la sílaba (ej. si dice "ma", "más" o "mamá")
      if (recognizedText.includes(expectedSyllable) || recognizedText.includes(expectedSyllable[0])) {
         handleWinRound();
      } else {
         handleLoseRound();
      }
    } catch (err) {
      setIsProcessingVoice(false);
      console.error("Error en STT:", err);
      playAudio("Hubo un problemita para escucharte, intentemos de nuevo.");
    }
  };

  // --- LÓGICA DE PARTIDA COMÚN ---
  const unlockNextPart = () => {
    const unlocked = JSON.parse(localStorage.getItem('unlockedParts') || '["1-1"]');
    const nextPart = phase < 3 ? `1-${phase + 1}` : '2-1'; // Si termina fase 3, desbloquea nivel 2
    if (!unlocked.includes(nextPart)) unlocked.push(nextPart);
    localStorage.setItem('unlockedParts', JSON.stringify(unlocked));
  };

  const handleWinRound = () => {
    const newScore = score + 1;
    setScore(newScore);
    
    if (newScore >= (phase === 3 ? 5 : 5)) { // Todas las fases piden 5 aciertos
      unlockNextPart();
      if (phase < 3) {
        playAudio("¡Excelente! Has completado esta parte. Vamos a la siguiente.");
        setPhase(phase + 1);
        setScore(0); setErrors(0); setShowOptions(false); setChestState('idle');
      } else {
        setGameStatus('won');
        playAudio("¡Felicidades! Has completado todas las partes del nivel. ¡Eres increíble!");
      }
    } else {
      playAudio("¡Muy bien! Esa es la respuesta correcta.");
      if (phase === 3) {
        setChestState('idle');
        setActiveItemIndex(prev => prev + 1);
      } else {
        setTimeout(() => { setShowOptions(false); setChestState('idle'); setActiveItemIndex(null); }, 2500);
      }
    }
  };

  const handleLoseRound = () => {
    const newErrors = errors + 1;
    setErrors(newErrors);
    
    if (newErrors >= 3) {
      setGameStatus('lost');
      playAudio("¡Oh no! Tuvimos tres errores. Pero no pasa nada, ¡reintentemos esta parte!");
    } else {
      playAudio("Casi... Esa no es la correcta. ¡Intenta de nuevo!");
      if (phase < 3) setTimeout(() => { setShowOptions(false); setChestState('idle'); setActiveItemIndex(null); }, 2500);
    }
  };

  const handleOptionClick = (option) => {
    const isCorrect = phase === 1 ? option.word === selectedData.correct.word : option === selectedData.correct;
    if (isCorrect) handleWinRound(); else handleLoseRound();
  };

  const resetGame = () => {
    setScore(0); setErrors(0); setGameStatus('playing'); setShowOptions(false); setChestState('idle'); setActiveItemIndex(phase === 3 ? 0 : null);
  };

  useEffect(() => { return () => { if (audioRef.current) audioRef.current.pause(); }; }, []);

  return (
    <div className="classroom-screen">
      <div className="hud-container">
        <div className="score-box">
          {[...Array(5)].map((_, i) => (
            <Star key={`s-${i}`} size={32} fill={i < score ? "#ffdd59" : "transparent"} color={i < score ? "#ffdd59" : "#d2dae2"} />
          ))}
        </div>
        <div className="errors-box">
          {[...Array(3)].map((_, i) => (
            <XCircle key={`e-${i}`} size={32} color={i < errors ? "#ff3f34" : "#d2dae2"} />
          ))}
        </div>
      </div>

      <button className="back-btn-class" onClick={() => navigate('/levels')}>
        <ArrowLeft size={40} color="white" />
      </button>

      {gameStatus === 'playing' && (
        <>
          <h1 className="class-title">Nivel {levelId}: Parte {phase}/3</h1>

          {/* FASE 1: RULETA */}
          {phase === 1 && !showOptions && (
            <div className="wheel-section">
              <div className="wheel-pointer">▼</div>
              <div className="wheel" style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3s ease-out' : 'none' }}>
                {Object.keys(syllablePool).map((syllable, index) => (
                  <div key={syllable} className="wheel-slice" style={{ transform: `rotate(${index * 72}deg)` }}>
                    <span className="syllable-text">{syllable}</span>
                  </div>
                ))}
              </div>
              <button className="spin-btn" onClick={spinWheel} disabled={isSpinning}>
                <RefreshCw size={40} className={isSpinning ? 'spin-anim' : ''} />
                {isSpinning ? 'Girando...' : '¡Girar Ruleta!'}
              </button>
            </div>
          )}

          {/* FASE 2: COFRES */}
          {phase === 2 && !showOptions && (
            <div className="chests-section">
              <h2 className="chests-instruction">{chestState === 'idle' ? '¡Elige un cofre!' : ''}</h2>
              <div className="chests-container">
                {[0, 1, 2].map(index => {
                  let chestClass = "chest";
                  if (activeItemIndex === index) {
                    if (chestState === 'shaking') chestClass += " shaking";
                    if (chestState === 'opened') chestClass += " opened";
                  } else if (chestState !== 'idle') {
                    chestClass += " disabled-chest";
                  }
                  return (
                    <div key={index} className={chestClass} onClick={() => handleChestClick(index)}>
                      {activeItemIndex === index && chestState === 'opened' ? (
                        <span className="target-icon-large">{selectedData?.wordObj?.icon}</span>
                      ) : <span className="chest-icon">🎁</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OPCIONES FASE 1 Y 2 */}
          {showOptions && phase < 3 && (
            <div className="options-section">
              <div className="target-syllable">
                {phase === 1 ? <h2>{selectedData.syllable}</h2> : (
                  <div className="target-word">
                    <span className="target-icon-large">{selectedData.wordObj.icon}</span>
                    <h2 className="target-word-text">{selectedData.wordObj.word.toUpperCase()}</h2>
                  </div>
                )}
              </div>
              <div className="cards-wrapper">
                {options.map((opt, i) => (
                  <button key={i} className="option-card" onClick={() => handleOptionClick(opt)}>
                    {phase === 1 ? (
                      <><span className="option-icon">{opt.icon}</span><span className="option-word">{opt.word.toUpperCase()}</span></>
                    ) : <span className="option-syllable-large">{opt}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FASE 3: CARTAS Y MICRÓFONO */}
          {phase === 3 && (
            <div className="cards-voice-section">
              <h2 className="chests-instruction">
                {chestState === 'idle' ? '¡Toca la carta para revelarla!' : '¡Mantén el micrófono apretado y habla!'}
              </h2>
              
              <div className="deck-container">
                {phaseItems.map((item, index) => {
                  const isActive = index === activeItemIndex;
                  const isDone = index < activeItemIndex;
                  
                  return (
                    <div 
                      key={index} 
                      className={`playing-card ${isActive && chestState === 'opened' ? 'flipped' : ''} ${isDone ? 'done-card' : ''}`}
                      onClick={() => { if (isActive && chestState === 'idle') flipCard(); }}
                    >
                      {isActive && chestState === 'opened' || isDone ? (
                        <div className="card-front">
                          <span className="card-icon">{item.icon}</span>
                        </div>
                      ) : (
                        <div className="card-back">❓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón de Micrófono que solo aparece cuando la carta se voltea */}
              {chestState === 'opened' && (
                <div className="mic-container">
                  <button 
                    className={`mic-btn ${isRecording ? 'recording' : ''}`}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={isProcessingVoice}
                  >
                    <Mic size={60} color="white" />
                  </button>
                  <p>{isProcessingVoice ? "Pensando..." : "Mantenme presionado para hablar"}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* OVERLAYS MANTENIDOS IGUAL */}
      {gameStatus === 'won' && (
        <div className="overlay-screen won-screen">
          <Star size={120} fill="#ffdd59" color="#feca57" className="bounce-anim" />
          <h1>¡Nivel Completado!</h1>
          <button className="action-btn success-btn" onClick={() => navigate('/levels')}><Map size={32} /> Volver al Mapa</button>
        </div>
      )}
      {gameStatus === 'lost' && (
        <div className="overlay-screen lost-screen">
          <div className="sad-fito">🐶</div>
          <h1>¡Casi lo logras!</h1>
          <button className="action-btn retry-btn" onClick={resetGame}><RotateCcw size={32} /> ¡Reintentar!</button>
        </div>
      )}
    </div>
  );
};