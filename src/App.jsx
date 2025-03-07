import React, { useState, useEffect, useRef } from 'react';
import GameArea from './components/GameArea';
import Scoreboard from './components/Scoreboard';
import ControlButtons from './components/ControlButtons';
import useGameLoop from './hooks/useGameLoop';
import './styles/animations.css';

const PreciseCollisionGame = () => {
  // State initialization
  const [score, setScore] = useState({ safe: 0, malicious: 0, missed: 0 });
  const [logoPosition, setLogoPosition] = useState('up');
  const [packages, setPackages] = useState([]);
  const [inspecting, setInspecting] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [conveyorSpeed, setConveyorSpeed] = useState(120);
  
  // Refs
  const gameAreaRef = useRef(null);
  const logoWidthRef = useRef(80);
  const logoHitscanRef = useRef(null);
  const packageWidthRef = useRef(48);
  
  // Toggle handlers
  const toggleDebugMode = () => setDebugMode((d) => !d);
  const toggleAutoPilot = () => {
    setAutoPilot((a) => {
      if (!a) {
        setScore((prev) => ({...prev, missed: 0}));
      }
      return !a; 
    });
  };
  
  // Logo click handler
  const handleLogoClick = () => {
    if (!autoPilot) {
      setLogoPosition('down');
      setTimeout(() => setLogoPosition('up'), 200);
    }
  };
  
  // Update hitscan on resize
  useEffect(() => {
    const updateLogoHitscan = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        logoHitscanRef.current = rect.width / 2;
      }
    };
    updateLogoHitscan();
    window.addEventListener('resize', updateLogoHitscan);
    return () => window.removeEventListener('resize', updateLogoHitscan);
  }, []);
  
  // Setup speed transition
  useEffect(() => {
    let animationId;
    let startTime;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const targetSpeed = inspecting && !autoPilot ? 0 : 120;
      const duration = inspecting && !autoPilot ? 50 : 250;

      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const startSpeed = inspecting && !autoPilot ? 120 : 0;
      const newSpeed = startSpeed + (targetSpeed - startSpeed) * eased;

      setConveyorSpeed(newSpeed);
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [inspecting, autoPilot]);
  
  // Use the game loop hook
  useGameLoop({
    inspecting,
    autoPilot,
    logoPosition,
    packages,
    conveyorSpeed,
    setPackages,
    setScore,
    setInspecting,
    setCurrentInspection,
    setLogoPosition,
    gameAreaRef,
    logoHitscanRef,
    packageWidthRef
  });

  return (
    <div className="flex justify-center items-center w-full bg-gray-50">
      <div
        className="relative w-full max-w-4xl mx-auto bg-gray-50 overflow-hidden"
        style={{ height: '500px' }}
      >
        <ControlButtons 
          debugMode={debugMode}
          autoPilot={autoPilot}
          toggleDebugMode={toggleDebugMode}
          toggleAutoPilot={toggleAutoPilot}
          conveyorSpeed={conveyorSpeed}
        />
        
        <Scoreboard 
          score={score}
          autoPilot={autoPilot}
        />
        
        <GameArea 
          gameAreaRef={gameAreaRef}
          logoHitscanRef={logoHitscanRef}
          debugMode={debugMode}
          packages={packages}
          inspecting={inspecting}
          logoPosition={logoPosition}
          handleLogoClick={handleLogoClick}
          currentInspection={currentInspection}
          autoPilot={autoPilot}
          logoWidthRef={logoWidthRef}
        />
      </div>
    </div>
  );
};

export default PreciseCollisionGame;
