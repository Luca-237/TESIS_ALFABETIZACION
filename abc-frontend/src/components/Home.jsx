import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Play, Award } from 'lucide-react';
import './Home.css';

export const Home = () => {
  const navigate = useNavigate();
  
  // Referencias para controlar el audio
  const audioRef = useRef(null);
  const hasAutoPlayed = useRef(false);

  const playGreeting = async () => {
    try {
      // 1. Si ya hay un audio sonando (porque el niño hizo clic varias veces), lo pausamos
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const response = await fetch('http://localhost:3000/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Bienvenido a FITO A B C, aprendamos juntos cómo leer" })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);
      
      // Guardamos la referencia del nuevo audio y lo reproducimos
      audioRef.current = newAudio;
      newAudio.play();
    } catch (error) {
      console.error("Error reproduciendo el saludo:", error);
    }
  };

  useEffect(() => {
    // 2. Evitamos que StrictMode dispare el audio dos veces al cargar
    if (!hasAutoPlayed.current) {
      playGreeting();
      hasAutoPlayed.current = true;
    }

    // 3. Función de limpieza: Si el niño cambia de pantalla antes de que termine de hablar, silenciamos el audio
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="home-screen">
      <div className="top-right-controls">
        <UserButton afterSignOutUrl="/" />
      </div>

      <button className="badges-floating-btn" onClick={() => navigate('/badges')}>
        <Award size={56} className="badge-icon" />
      </button>

      <div className="center-stage">
        <div className="mascot-greeting" onClick={playGreeting} style={{ cursor: 'pointer' }}>
          <div className="fito-placeholder">
            🐶
          </div>
          <h1 className="greeting-text">¡A jugar!</h1>
        </div>

        <button className="giant-play-btn" onClick={() => navigate('/levels')}>
          <Play size={100} fill="currentColor" color="white" className="play-icon" />
        </button>
      </div>
    </div>
  );
};