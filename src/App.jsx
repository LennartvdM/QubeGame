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
  // Refs for animation timing
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const nextPackageTimeRef = useRef(0);

  // Store dynamic props in refs to avoid recreating the loop callback
  const gameActiveRef = useRef(gameActive);
  const inspectingRef = useRef(inspecting);
  const autoPilotRef = useRef(autoPilot);
  const conveyorSpeedRef = useRef(conveyorSpeed);
  const setPackagesRef = useRef(setPackages);
  const packagesRef = useRef(packages);

  useEffect(() => {
    gameActiveRef.current = gameActive;
    inspectingRef.current = inspecting;
    autoPilotRef.current = autoPilot;
    conveyorSpeedRef.current = conveyorSpeed;
    packagesRef.current = packages;
  }, [gameActive, inspecting, autoPilot, conveyorSpeed, packages]);

  // Create a stable gameLoop function stored in a ref
  const gameLoopRef = useRef();
  if (!gameLoopRef.current) {
    gameLoopRef.current = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Spawn packages if it's time and the game is active
      if (timestamp >= nextPackageTimeRef.current && gameActiveRef.current) {
        const lastPackage = packagesRef.current[packagesRef.current.length - 1];
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
            velocity: 0,
            creationTime: Date.now(),
          };
          setPackagesRef.current((prev) => [...prev, newPackage]);

          const nextInterval = Math.random() * 1500 + 300;
          nextPackageTimeRef.current = timestamp + nextInterval;
        } else {
          nextPackageTimeRef.current = timestamp + 50;
        }
      }

      // Move packages if not inspecting or if autoPilot is active
      if (!inspectingRef.current || autoPilotRef.current) {
        setPackagesRef.current((prev) =>
          prev
            .map((pkg) => {
              const newX = pkg.x + (conveyorSpeedRef.current * deltaTime) / 1000;
              return {
                ...pkg,
                x: newX,
                centerPoint: {
                  ...pkg.centerPoint,
                  x: newX + pkg.width / 2,
                },
              };
            })
            .filter((pkg) => pkg.x < window.innerWidth + 100)
        );
      }

      // Request the next frame using the stable gameLoop function stored in gameLoopRef
      animationRef.current = requestAnimationFrame(gameLoopRef.current);
    };
  }

  // Start the loop once on mount
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoopRef.current);
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return null;
};

export default useGameLoop;
