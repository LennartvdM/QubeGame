import { useEffect, useRef } from 'react';

const useGameLoop = ({
  gameActive,
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
}) => {
  // Refs for animation and timing
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const burstModeRef = useRef(false);
  const lastPackageTimeRef = useRef(0);
  const nextPackageTimeRef = useRef(0);
  const packageSpeedRef = useRef(120);
  const minPackageIntervalRef = useRef(300);
  const maxPackageIntervalRef = useRef(1500);
  const baseSpawnRateRef = useRef(1000);
  const gravityRef = useRef(980); // pixels per second squared

  // Main game loop
  useEffect(() => {
    const gameLoop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // spawn packages
      if (timestamp >= nextPackageTimeRef.current && gameActive) {
        const lastPackage = packages[packages.length - 1];
        const minDist = packageWidthRef.current + 5;
        const canSpawn = !lastPackage || lastPackage.x > minDist;
        if (canSpawn) {
          const isMalicious = Math.random() < 0.4;
          const newPackage = {
            id: Date.now(),
            x: -60,
            y: 290,
            width: packageWidthRef.current,
            isMalicious,
            type: isMalicious ? 'malicious' : 'safe',
            status: 'unprocessed',
            centerPoint: {
              x: -60 + packageWidthRef.current / 2,
              width: 4,
            },
            randomDelay: Math.random(),
            velocity: 0,
            creationTime: Date.now(), // Track when the package was created
          };
          setPackages((p) => [...p, newPackage]);

          if (!burstModeRef.current || burstModeRef.current.remaining <= 0) {
            const comboSize = Math.floor(Math.random() * 4) + 1;
            burstModeRef.current = {
              remaining: comboSize,
              intraComboDelay: 10 + Math.random() * 15,
              postComboDelay: 1200 + Math.random() * 1800,
            };
          }

          let nextInterval;
          if (burstModeRef.current.remaining > 1) {
            nextInterval = burstModeRef.current.intraComboDelay;
          } else {
            nextInterval = burstModeRef.current.postComboDelay;
          }
          burstModeRef.current.remaining--;

          const minTime = (minDist / packageSpeedRef.current) * 1000;
          nextInterval = Math.max(minTime, nextInterval);
          nextPackageTimeRef.current = timestamp + nextInterval;
        } else {
          nextPackageTimeRef.current = timestamp + 50;
        }
      }

      // move packages
      if (!inspecting || autoPilot) {
        setPackages((prev) => {
          return prev
            .map((pkg) => {
              // Handle threat animation in renderPackage, not here
              if (pkg.status === 'threat') {
                // Only update horizontal position for threats (vertical is handled in renderPackage)
                const horizontalSpeed = conveyorSpeed * 0.2;
                return
