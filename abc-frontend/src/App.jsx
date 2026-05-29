import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { Home } from './components/Home';
import { LevelSelection } from './components/LevelSelection';

// Componentes temporales para las otras rutas
const Classroom = () => <div style={{ fontSize: '3rem', textAlign: 'center', marginTop: '20vh' }}>🎤 Clase Interactiva</div>;
const Badges = () => <div style={{ fontSize: '3rem', textAlign: 'center', marginTop: '20vh' }}>🏅 Mis Insignias</div>;

function App() {
  return (
    <Routes>
      {/* RUTA PÚBLICA */}
      <Route path="/sign-in/*" element={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f8ff' }}>
          <SignIn routing="path" path="/sign-in" />
        </div>
      } />

      {/* RUTAS PROTEGIDAS */}
      <Route path="/" element={
        <>
          <SignedIn><Home /></SignedIn>
          <SignedOut><Navigate to="/sign-in" /></SignedOut>
        </>
      } />
      
      <Route path="/levels" element={
        <>
          <SignedIn><LevelSelection /></SignedIn>
          <SignedOut><Navigate to="/sign-in" /></SignedOut>
        </>
      } />

      <Route path="/badges" element={
        <>
          <SignedIn><Badges /></SignedIn>
          <SignedOut><Navigate to="/sign-in" /></SignedOut>
        </>
      } />

      <Route path="/class/:levelId" element={
        <>
          <SignedIn><Classroom /></SignedIn>
          <SignedOut><Navigate to="/sign-in" /></SignedOut>
        </>
      } />
    </Routes>
  );
}

export default App;