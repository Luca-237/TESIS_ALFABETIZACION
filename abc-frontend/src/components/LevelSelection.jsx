import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Star } from 'lucide-react';
import './LevelSelection.css';

export const LevelSelection = () => {
  const navigate = useNavigate();

  // Datos de prueba (luego esto vendrá de un fetch a /api/levels)
  const levels = [
    { id: 1, title: 'Sílabas ma-me-mi', isLocked: false, stars: 3 },
    { id: 2, title: 'Sílabas verdes', isLocked: true, stars: 0 },
    { id: 3, title: 'Orden de sílabas', isLocked: true, stars: 0 },
    { id: 4, title: 'Palabras simples', isLocked: true, stars: 0 },
  ];

  return (
    <div className="levels-screen">
      {/* Botón de volver arriba a la izquierda */}
      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={40} color="white" />
      </button>

      <h1 className="levels-title">Mapa de Niveles</h1>

      <div className="levels-path">
        {levels.map((level, index) => (
          <div 
            key={level.id} 
            className={`level-node ${level.isLocked ? 'locked' : 'unlocked'}`}
            onClick={() => !level.isLocked && navigate(`/class/${level.id}`)}
          >
            <div className="level-circle">
              {level.isLocked ? (
                <Lock size={48} color="#a4b0be" />
              ) : (
                <Unlock size={48} color="#2ed573" />
              )}
            </div>
            
            <div className="level-info">
              <h2>Nivel {level.id}</h2>
              <p>{level.title}</p>
              
              {/* Mostramos las estrellitas si ya lo jugó */}
              {!level.isLocked && (
                <div className="stars-container">
                  {[...Array(3)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={24} 
                      fill={i < level.stars ? "#ffa502" : "transparent"} 
                      color={i < level.stars ? "#ffa502" : "#dfe4ea"} 
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Línea conectora entre niveles (no se muestra en el último) */}
            {index < levels.length - 1 && <div className="path-line"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};