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
  const nextPackageTimeRef = useRef(0);

  // Keep a ref of the latest packages array to avoid re-creating the loop function
  const packagesRef = useRef(packages);
  useEffect(() => {
    packagesRef.current = packages;
  }, [packages]);

  useEffect(() => {
    const gameLoop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Spawn packages if it's time and the game is active
      if (timestamp >= nextPackageTimeRef.current && gameActive) {
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
          setPackages((prev) => [...prev, newPackage]);

          const nextInterval = Math.random() * 1500 + 300;
          nextPackageTimeRef.current = timestamp + nextInterval;
        } else {
          nextPackageTimeRef.current = timestamp + 50;
        }
      }

      // Move packages if not inspecting or if autoPilot is active
      if (!inspecting || autoPilot) {
        setPackages((prev) =>
          prev
            .map((pkg) => {
              const newX = pkg.x + (conveyorSpeed * deltaTime) / 1000;
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

      // Request the next frame using the gameLoop defined above
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the loop
    animationRef.current = requestAnimationFrame(gameLoop);

    // Cleanup on unmount
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    gameActive,
    conveyorSpeed,
    inspecting,
    autoPilot,
    setPackages,
    packageWidthRef,
    logoPosition,
    setScore,
    setInspecting,
    setCurrentInspection,
    setLogoPosition,
    logoHitscanRef,
  ]);

  return null;
};

export default useGameLoop;
