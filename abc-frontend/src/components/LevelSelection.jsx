import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Star, PlayCircle } from 'lucide-react';
import './LevelSelection.css';

export const LevelSelection = () => {
  const navigate = useNavigate();

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
      ]
    },
    { 
      id: 2, 
      title: 'Sílabas con P', 
      parts: [
        { id: 1, name: 'La Ruleta (Sílaba a Palabra)' },
        { id: 2, name: 'Los Cofres (Palabra a Sílaba)' },
        { id: 3, name: 'Las Cartas (¡Usa tu Voz!)' }
      ] 
    },
    { 
      id: 3, 
      title: 'Sílabas con S', 
      parts: [
        { id: 1, name: 'La Ruleta (Sílaba a Palabra)' },
        { id: 2, name: 'Los Cofres (Palabra a Sílaba)' },
        { id: 3, name: 'Las Cartas (¡Usa tu Voz!)' }
      ] 
    }
  ];

  return (
    <div className="levels-screen">
      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={40} color="white" />
      </button>

      <h1 className="levels-title">Mapa de Niveles</h1>

      <div className="levels-path">
        {levels.map((level, index) => {
          // Un nivel está desbloqueado si al menos su primera parte lo está
          const isLevelUnlocked = unlockedParts.includes(`${level.id}-1`);

          return (
            <div key={level.id} className={`level-node ${isLevelUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="level-circle">
                {isLevelUnlocked ? <Unlock size={48} color="#2ed573" /> : <Lock size={48} color="#a4b0be" />}
              </div>
              
              <div className="level-info">
                <h2>Nivel {level.id}</h2>
                <p>{level.title}</p>
                
                {/* Mostramos las partes si el nivel está desbloqueado */}
                {isLevelUnlocked && (
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
                          {isPartUnlocked ? <PlayCircle size={20} /> : <Lock size={20} />}
                          Parte {part.id}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {index < levels.length - 1 && <div className="path-line"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};