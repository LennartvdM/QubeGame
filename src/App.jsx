import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameArea from './components/GameArea';
import ControlButtons from './components/ControlButtons';
import Scoreboard from './components/Scoreboard';
import useGameLoop from './hooks/useGameLoop';
import './styles/animations.css';

const INITIAL_PACKAGE_WIDTH = 80;
const INSPECTION_DURATION = 650;

const createInitialScore = () => ({ safe: 0, malicious: 0, missed: 0 });

const PreciseCollisionGame = () => {
  const [packages, setPackages] = useState([]);
  const [gameActive] = useState(true);
  const [inspecting, setInspecting] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [conveyorSpeed] = useState(120);
  const [score, setScore] = useState(() => createInitialScore());
  const [currentInspection, setCurrentInspection] = useState(null);
  const [logoPosition, setLogoPosition] = useState('down');

  const gameAreaRef = useRef(null);
  const logoHitscanRef = useRef(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const logoWidthRef = useRef(96);
  const packageWidthRef = useRef(INITIAL_PACKAGE_WIDTH);
  const inspectionTimeoutRef = useRef(null);

  const updateMeasurements = useCallback(() => {
    if (typeof window === 'undefined') return;
    const { innerWidth } = window;
    logoHitscanRef.current = innerWidth / 2;
    logoWidthRef.current = Math.min(120, Math.max(80, Math.round(innerWidth * 0.09)));
    packageWidthRef.current = Math.max(60, Math.min(110, Math.round(innerWidth * 0.08)));
  }, []);

  useEffect(() => {
    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [updateMeasurements]);

  const handlePackageMissed = useCallback((pkg) => {
    if (pkg?.type !== 'malicious') return;
    setScore((prev) => ({ ...prev, missed: prev.missed + 1 }));
  }, []);

  useGameLoop({
    gameActive,
    inspecting,
    autoPilot,
    packages,
    conveyorSpeed,
    setPackages,
    logoHitscanRef,
    packageWidthRef,
    onPackageMissed: handlePackageMissed,
  });

  useEffect(() => () => clearTimeout(inspectionTimeoutRef.current), []);

  const toggleDebugMode = useCallback(() => setDebugMode((prev) => !prev), []);
  const toggleAutoPilot = useCallback(() => setAutoPilot((prev) => !prev), []);

  const findPackageForInspection = useCallback(() => {
    const hitscan = logoHitscanRef.current;
    return packages.find((pkg) => {
      if (pkg.status !== 'unprocessed') return false;
      const start = pkg.x;
      const end = pkg.x + pkg.width;
      return hitscan >= start && hitscan <= end;
    });
  }, [packages]);

  const completeInspection = useCallback((packageId) => {
    let resolvedPackage = null;
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== packageId) return pkg;
        const status = pkg.type === 'malicious' ? 'threat' : 'safe';
        resolvedPackage = { ...pkg, status, inspectionTime: Date.now(), hideQuestionMark: true };
        return resolvedPackage;
      })
    );

    if (resolvedPackage) {
      setScore((prev) => ({
        safe: prev.safe + (resolvedPackage.type === 'malicious' ? 0 : 1),
        malicious: prev.malicious + (resolvedPackage.type === 'malicious' ? 1 : 0),
        missed: prev.missed,
      }));
    }

    setInspecting(false);
    setLogoPosition('down');
    setCurrentInspection(null);
  }, []);

  const handleLogoClick = useCallback(() => {
    if (!gameActive || inspecting) return;
    const targetPackage = findPackageForInspection();
    if (!targetPackage) return;

    setInspecting(true);
    setLogoPosition('up');
    setCurrentInspection(targetPackage.id);
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === targetPackage.id
          ? { ...pkg, status: 'inspecting', hideQuestionMark: true }
          : pkg
      )
    );

    clearTimeout(inspectionTimeoutRef.current);
    inspectionTimeoutRef.current = setTimeout(() => {
      completeInspection(targetPackage.id);
    }, INSPECTION_DURATION);
  }, [completeInspection, findPackageForInspection, gameActive, inspecting]);

  useEffect(() => {
    if (!autoPilot || inspecting) return;
    const target = findPackageForInspection();
    if (target && target.type === 'malicious') {
      handleLogoClick();
    }
  }, [autoPilot, findPackageForInspection, handleLogoClick, inspecting]);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white select-none">
      <Scoreboard score={score} autoPilot={autoPilot} />
      <ControlButtons
        debugMode={debugMode}
        autoPilot={autoPilot}
        toggleDebugMode={toggleDebugMode}
        toggleAutoPilot={toggleAutoPilot}
        conveyorSpeed={conveyorSpeed}
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
  );
};

export default PreciseCollisionGame;
