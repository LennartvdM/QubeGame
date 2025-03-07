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
                return {
                  ...pkg,
                  x: pkg.x + (horizontalSpeed * deltaTime) / 1000,
                };
              }
              
              const speed = conveyorSpeed;
              const newX = pkg.x + (speed * deltaTime) / 1000;
              const newCenterPoint = {
                ...pkg.centerPoint,
                x: newX + pkg.width / 2,
              };
              const inspLine = logoHitscanRef.current;

              if (pkg.status === 'unprocessed' && newX > inspLine) {
                if (pkg.type === 'malicious') {
                  setScore((s) => ({ ...s, missed: s.missed + 1 }));
                }
                
                // Keep the question mark visible during the entire transition
                return {
                  ...pkg,
                  x: newX,
                  centerPoint: newCenterPoint,
                  status: 'missed',
                  missedTime: Date.now(), // Add timestamp for fade animation
                  wasUnprocessed: true, // Flag to show question mark
                  originalText: '?', // Store the original text
                };
              }
              
              return {
                ...pkg,
                x: newX,
                centerPoint: newCenterPoint,
              };
            })
            .filter(
              (pkg) => {
                // Remove packages that are off-screen or have exceeded their lifetime
                const now = Date.now();
                const packageAge = now - (pkg.creationTime || now);
                const lifetimeExceeded = packageAge > 13000; // 13 seconds lifetime
                
                const isOffscreenX = pkg.x > window.innerWidth + 100;
                const isOffscreenY = pkg.status === 'threat' && pkg.y > 650;
                
                // Keep package if it's still on screen and within lifetime
                return !lifetimeExceeded && !isOffscreenX && !isOffscreenY;
              }
            );
        });
      }

      // autoPilot
      if (autoPilot && !inspecting && gameActive && logoPosition === 'up') {
        const inspLine = logoHitscanRef.current;
        const unprocessed = packages.filter((p) => p.status === 'unprocessed');
        const toScan = unprocessed.filter((p) => {
          if (!p || !p.centerPoint) return false;
          const dist = Math.abs(p.centerPoint.x - inspLine);
          return dist <= 1;
        });
        if (toScan.length > 0) {
          toScan.sort((a, b) => {
            const aC = a.centerPoint.x;
            const bC = b.centerPoint.x;
            return Math.abs(inspLine - aC) - Math.abs(inspLine - bC);
          });
          setLogoPosition('down');
          setTimeout(() => setLogoPosition('up'), 150);
        }
      }

      // manual inspection
      if (logoPosition === 'down' && !inspecting) {
        const inspLine = logoHitscanRef.current;
        const toInspect = packages.filter((p) => {
          if (p.status !== 'unprocessed') return false;
          const left = p.x;
          const right = p.x + p.width;
          return left <= inspLine && right >= inspLine;
        });
        
        if (toInspect.length > 0) {
          const target = toInspect[0];
          setInspecting(true);
          setCurrentInspection({ ...target });
          
          // Mark package as inspecting - immediately hide the question mark
          setPackages((prev) => prev.map((pkg) => 
            pkg.id === target.id ? { 
              ...pkg, 
              status: 'inspecting',
              duckStartTime: Date.now(),
              hideQuestionMark: true // Flag to hide question mark
            } : pkg
          ));

          setTimeout(() => {
            setPackages((prevPack) => {
              const currentPackage = prevPack.find((p) => p.id === target.id);
              if (!currentPackage) return prevPack;

              const isMal = currentPackage.type === 'malicious';
              if (isMal) {
                setScore((sc) => ({ ...sc, malicious: sc.malicious + 1 }));
                return prevPack.map((p) => (p.id === target.id ? { 
                  ...p, 
                  status: 'threat',
                  inspectionTime: Date.now(),
                } : p));
              } else {
                setScore((sc) => ({ ...sc, safe: sc.safe + 1 }));
                return prevPack.map((p) => (p.id === target.id ? { 
                  ...p, 
                  status: 'safe',
                  safeRecoveryStart: Date.now(), // Track when recovery starts
                } : p));
              }
            });
            setInspecting(false);
            setCurrentInspection(null);
          }, 350);
        }
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
    logoPosition, 
    packages, 
    autoPilot, 
    conveyorSpeed, 
    setPackages, 
    setScore, 
    setInspecting, 
    setCurrentInspection, 
    setLogoPosition,
    logoHitscanRef
  ]);

  return null;
};

export default useGameLoop;
