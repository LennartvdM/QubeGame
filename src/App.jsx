import { useEffect, useRef } from 'react';

const useGameLoop = ({
  gameActive,
  inspecting,
  autoPilot,
  packages,
  conveyorSpeed,
  setPackages,
  packageWidthRef,
}) => {
  // Basic refs for animation timing
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Keep a ref of packages so the loop always sees the latest state
  const packagesRef = useRef(packages);
  useEffect(() => {
    packagesRef.current = packages;
  }, [packages]);

  useEffect(() => {
    // Define a stable game loop function
    function gameLoop(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Only if gameActive is true, move packages (simplified logic)
      if (gameActive) {
        setPackages((prev) =>
          prev
            .map((pkg) => {
              const newX = pkg.x + (conveyorSpeed * deltaTime) / 1000;
              return { ...pkg, x: newX };
            })
            .filter((pkg) => pkg.x < window.innerWidth + 100)
        );
      }

      // Request the next frame using the same gameLoop reference
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    // Start the loop
    animationRef.current = requestAnimationFrame(gameLoop);

    // Cleanup on unmount
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameActive, conveyorSpeed, setPackages]);

  return null;
};

export default useGameLoop;
