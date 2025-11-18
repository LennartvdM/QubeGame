import { useEffect, useRef } from 'react';

const useGameLoop = ({
  gameActive,
  inspecting,
  autoPilot,
  packages,
  conveyorSpeed,
  setPackages,
  logoHitscanRef,
  packageWidthRef,
  onPackageMissed,
}) => {
  // Refs for animation and timing
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const nextPackageTimeRef = useRef(0);
  const packagesRef = useRef(packages);

  useEffect(() => {
    packagesRef.current = packages;
  }, [packages]);

  // Main game loop
  useEffect(() => {
    const gameLoop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Spawn packages
      if (timestamp >= nextPackageTimeRef.current && gameActive) {
        const currentPackages = packagesRef.current;
        const lastPackage = currentPackages[currentPackages.length - 1];
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
          setPackages((p) => [...p, newPackage]);

          let nextInterval = Math.random() * 1500 + 300;
          nextPackageTimeRef.current = timestamp + nextInterval;
        } else {
          nextPackageTimeRef.current = timestamp + 50;
        }
      }

      // Move packages
      if (!inspecting || autoPilot) {
        setPackages((prev) => {
          const hitscan = logoHitscanRef.current ?? window.innerWidth / 2;
          return prev
            .map((pkg) => {
              const speed = conveyorSpeed;
              const newX = pkg.x + (speed * deltaTime) / 1000;
              const newCenterPoint = {
                ...pkg.centerPoint,
                x: newX + pkg.width / 2,
              };
              let nextStatus = pkg.status;
              let wasUnprocessed = pkg.wasUnprocessed;

              if (
                pkg.status === 'unprocessed' &&
                newCenterPoint.x > hitscan + pkg.width * 0.2
              ) {
                if (pkg.type === 'malicious') {
                  nextStatus = 'missed';
                  wasUnprocessed = true;
                  if (onPackageMissed) {
                    onPackageMissed(pkg);
                  }
                } else {
                  nextStatus = 'safe';
                }
              }

              return {
                ...pkg,
                x: newX,
                centerPoint: newCenterPoint,
                status: nextStatus,
                wasUnprocessed,
              };
            })
            .filter((pkg) => pkg.x < window.innerWidth + 100);
        });
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    gameActive,
    inspecting,
    autoPilot,
    conveyorSpeed,
    setPackages,
    logoHitscanRef,
    packageWidthRef,
    onPackageMissed,
  ]);

  return null;
};

export default useGameLoop;
