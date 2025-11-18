import React from 'react';
import Package from './Package';
import Logo from './Logo';

const GameArea = ({ 
  gameAreaRef, 
  logoHitscanRef, 
  debugMode, 
  packages, 
  inspecting, 
  logoPosition, 
  handleLogoClick,
  currentInspection,
  autoPilot,
  logoWidthRef
}) => {
  
  const renderInspectionBeam = () => {
    if (inspecting && currentInspection) {
      return (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 rounded-full bg-purple-300 animate-ping"
          style={{
            top: '290px',
            width: '20px',
            height: '20px',
            marginLeft: '-10px',
            opacity: 0.6,
          }}
        ></div>
      );
    }
    return null;
  };

  const renderCollisionDebug = () => {
    if (!debugMode) return null;
    const inspectionPoint = logoHitscanRef.current;
    return (
      <>
        <div
          className="absolute h-full w-0.5 bg-red-500 opacity-50 z-10"
          style={{
            left: `${inspectionPoint}px`,
          }}
        ></div>
      </>
    );
  };

  return (
    <div ref={gameAreaRef} className="relative w-full h-screen overflow-hidden bg-gray-800">
      {renderInspectionBeam()}
      {renderCollisionDebug()}

      {packages.map((pkg, index) => (
        <Package key={index} {...pkg} />
      ))}

      <Logo
        position={logoPosition}
        onClick={handleLogoClick}
        ref={logoWidthRef}
        autoPilot={autoPilot}
      />
    </div>
  );
};

export default GameArea;
