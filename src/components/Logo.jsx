import React, { useRef, useState } from 'react';

const Logo = ({
  position,
  onClick,
  autoPilot,
  logoWidthRef,
  onGesture,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wiggleActive, setWiggleActive] = useState(false);
  const [gestureEffect, setGestureEffect] = useState(null);
  const pointerDataRef = useRef(null);
  const suppressClickRef = useRef(false);

  const handleLogoHover = (hovering) => {
    setIsHovered(hovering);
    if (hovering) {
      setWiggleActive(true);
    }
  };

  const engageTouchHover = () => {
    if (!isTouchEnvironment()) return;
    handleLogoHover(true);
  };

  const releaseTouchHover = () => {
    if (!isTouchEnvironment()) return;
    handleLogoHover(false);
  };

  const handleWiggleEnd = (e) => {
    if (e.animationName === 'wiggleInner') {
      setWiggleActive(false);
    }
  };

  const handleGestureAnimationEnd = (e) => {
    if (e.animationName === 'slamImpact' || e.animationName === 'catapultLaunch') {
      setGestureEffect(null);
    }
  };

  const isTouchEnvironment = () => {
    if (typeof window === 'undefined') return false;
    if ('matchMedia' in window && window.matchMedia('(pointer: coarse)').matches) {
      return true;
    }
    if ('navigator' in window && navigator?.maxTouchPoints > 0) {
      return true;
    }
    return 'ontouchstart' in window;
  };

  const shouldHandlePointer = (event) => {
    if (!isTouchEnvironment()) return false;
    if (!event.pointerType) return true;
    return event.pointerType === 'touch' || event.pointerType === 'pen';
  };

  const resetPointerData = () => {
    pointerDataRef.current = null;
  };

  const triggerGesture = (event, direction, meta) => {
    suppressClickRef.current = true;
    const strength = Math.min(Math.max(meta.strength || 0, 0), 1);
    setGestureEffect({ type: direction, strength });

    if (direction === 'down') {
      onClick?.(event);
    }

    onGesture?.({ direction, ...meta });
  };

  const evaluateGesture = (event, cancelled = false) => {
    const pointerData = pointerDataRef.current;
    if (!pointerData) return;

    if (event.currentTarget?.releasePointerCapture && pointerData.pointerId != null) {
      try {
        event.currentTarget.releasePointerCapture(pointerData.pointerId);
      } catch (err) {
        // pointer may already be released
      }
    }

    if (cancelled) {
      resetPointerData();
      return;
    }

    const deltaY = pointerData.lastY - pointerData.startY;
    const absDeltaY = Math.abs(deltaY);
    const deltaTime = Math.max(event.timeStamp - pointerData.startTime, 1);
    const velocity = absDeltaY / deltaTime;
    const downwardThreshold = 55;
    const upwardThreshold = -55;
    const velocityThreshold = 0.35;
    const tapSlop = 10;

    if (absDeltaY <= tapSlop) {
      resetPointerData();
      return;
    }

    const qualifiesDownward =
      deltaY > 0 &&
      (deltaY >= downwardThreshold || (absDeltaY >= 28 && velocity > velocityThreshold));
    const qualifiesUpward =
      deltaY < 0 &&
      (deltaY <= upwardThreshold || (absDeltaY >= 28 && velocity > velocityThreshold));

    if (qualifiesDownward) {
      event.preventDefault();
      const strength = Math.min(absDeltaY / 160, 1);
      triggerGesture(event, 'down', { strength, velocity, deltaY });
    } else if (qualifiesUpward) {
      event.preventDefault();
      const strength = Math.min(absDeltaY / 180, 1);
      triggerGesture(event, 'up', { strength, velocity, deltaY });
    }

    resetPointerData();
  };

  const handlePointerDown = (event) => {
    if (!shouldHandlePointer(event)) return;
    suppressClickRef.current = false;
    pointerDataRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      startTime: event.timeStamp,
    };

    engageTouchHover();

    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event) => {
    if (!pointerDataRef.current || pointerDataRef.current.pointerId !== event.pointerId) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    pointerDataRef.current.lastY = event.clientY;
  };

  const handlePointerUp = (event) => {
    const pointerData = pointerDataRef.current;
    if (!pointerData || pointerData.pointerId !== event.pointerId) {
      releaseTouchHover();
      return;
    }
    evaluateGesture(event, false);
    releaseTouchHover();
  };

  const handlePointerCancel = (event) => {
    const pointerData = pointerDataRef.current;
    if (!pointerData || pointerData.pointerId !== event.pointerId) {
      releaseTouchHover();
      return;
    }
    evaluateGesture(event, true);
    releaseTouchHover();
  };

  const handleTap = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onClick?.(event);
  };

  const scaleValue = isHovered ? 1.15 : 1;
  const isActive = position === 'down';
  const autoPilotGlow = autoPilot ? 'filter drop-shadow-lg' : '';
  const widthValue = logoWidthRef?.current ? `${logoWidthRef.current}px` : '80px';
  const gestureWrapperClasses = ['gesture-wrapper'];
  if (gestureEffect?.type === 'down') {
    gestureWrapperClasses.push('gesture-slam');
  } else if (gestureEffect?.type === 'up') {
    gestureWrapperClasses.push('gesture-catapult');
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: position === 'up' ? '180px' : '240px',
        transform: `translateX(-50%) scale(${scaleValue})`,
        transformOrigin: 'center',
        transition: `
          top 0.3s cubic-bezier(0.34, 1.76, 0.64, 1.4),
          transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1.3)
        `,
        width: widthValue,
        pointerEvents: 'auto',
        cursor: 'pointer',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        overscrollBehaviorY: 'contain',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onClick={handleTap}
      onMouseEnter={() => handleLogoHover(true)}
      onMouseLeave={() => handleLogoHover(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className={`relative flex items-center justify-center
          ${autoPilot ? 'animate-bob-intense' : !isActive ? 'animate-bob' : ''}
          ${autoPilotGlow}
        `}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <div
          className={`relative w-full h-full flex items-center justify-center
            ${wiggleActive ? 'animate-wiggle-inner' : ''}
          `}
          onAnimationEnd={handleWiggleEnd}
        >
          <div
            className={gestureWrapperClasses.join(' ')}
            style={{
              '--gesture-strength': gestureEffect?.strength || 0,
              touchAction: 'none',
              overscrollBehavior: 'contain',
            }}
            onAnimationEnd={handleGestureAnimationEnd}
          >
            <div
              className={`w-20 h-20 rounded-lg shadow-md
                flex items-center justify-center
                ${!isActive ? 'bg-purple-500' : ''}
                ${autoPilot ? 'bg-purple-600' : ''}
              `}
              style={{
                transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1.1)',
                boxShadow: isActive
                  ? '0 10px 15px -3px rgba(76, 29, 149, 0.4)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                backgroundColor: isActive ? '#8054b3' : '',
                transform: 'rotate(45deg)',
              }}
            >
              <div
                className={`w-16 h-16 rounded-lg absolute ${!isActive ? 'bg-purple-400' : ''}`}
                style={{
                  backgroundColor: isActive ? '#9166c7' : '',
                  transition: 'background-color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              ></div>
              <div
                className={`w-12 h-12 rounded-lg absolute flex items-center justify-center ${!isActive ? 'bg-purple-300' : ''}`}
                style={{
                  backgroundColor: isActive ? '#a37dd6' : '',
                  transition: 'background-color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <div className="w-6 h-8 bg-white rounded-sm relative">
                  <div
                    className={`w-2 h-2 rounded-full absolute top-4 left-2
                      ${isActive ? 'bg-red-600' : 'bg-purple-700'}
                      ${autoPilot ? 'bg-orange-500 animate-pulse' : ''}`}
                    style={{
                      transition: 'background-color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logo;
