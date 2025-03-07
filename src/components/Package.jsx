import React from 'react';

const Package = ({ pkg, debugMode }) => {
  // Define package appearance based on status
  let packageStyle = '';
  let packageText = '';
  let textColor = '';

  switch (pkg.status) {
    case 'safe':
      packageStyle = 'bg-green-200 border-2 border-green-500';
      packageText = 'SAFE';
      textColor = 'text-green-500';
      break;
    case 'threat':
      packageStyle = 'bg-red-200 border-2 border-red-500';
      packageText = 'THREAT';
      textColor = 'text-red-500';
      break;
    case 'missed':
      packageStyle = 'bg-yellow-200 border-2 border-yellow-500';
      packageText = 'MISSED';
      textColor = 'text-yellow-500';
      break;
    case 'inspecting':
      packageStyle = pkg.type === 'malicious' ? 'bg-red-200 border border-red-400' : 'bg-green-200 border border-green-400';
      packageText = ''; // Empty text during inspection
      textColor = pkg.type === 'malicious' ? 'text-red-400' : 'text-green-400';
      break;
    case 'unprocessed':
    default:
      packageStyle = 'bg-purple-100 border border-purple-300';
      packageText = pkg.hideQuestionMark ? '' : '?';
      textColor = 'text-purple-800';
  }

  // Add twitching animation for unprocessed and missed packages
  const animationClass = (pkg.status === 'unprocessed' || pkg.status === 'missed') ? 'animate-twitch' : '';
  
  // Determine additional class names
  let extraClassName = '';
  
  // Add falling animation for threats
  if (pkg.status === 'threat' && pkg.inspectionTime) {
    const now = Date.now();
    const elapsed = (now - pkg.inspectionTime) / 1000; // seconds
    
    if (elapsed >= 0.15) {
      extraClassName += ' falling-threat';
    }
  }
  
  // Determine styles based on status
  const getPackageStyles = () => {
    const styles = {
      left: `${pkg.x}px`,
      width: `${pkg.width}px`,
      '--random-delay': pkg.randomDelay || 0,
    };
    
    if (pkg.status === 'inspecting') {
      return {
        ...styles,
        top: '320px',
        transition: 'top 0.3s cubic-bezier(0.17, 0.67, 0.24, 0.99)'
      };
    } else if (pkg.status === 'safe') {
      return {
        ...styles,
        top: '290px',
        transition: 'background-color 0.3s, top 0.8s cubic-bezier(0.34, 1.1, 0.64, 1.1)'
      };
    } else if (pkg.status === 'threat') {
      const now = Date.now();
      const elapsed = (now - pkg.inspectionTime) / 1000;
      if (elapsed < 0.15) {
        return {
          ...styles,
          top: '320px',
          transition: 'top 0.15s linear'
        };
      }
      return styles;
    }
    return {
      ...styles,
      top: '290px'
    };
  };

  return (
    <div
      key={pkg.id}
      className={`absolute h-10 rounded-md shadow-md flex items-center justify-center text-xs ${packageStyle} ${animationClass} ${extraClassName}`}
      style={getPackageStyles()}
    >
      {debugMode && (
        <div
          className="absolute h-full bg-red-500 z-0"
          style={{
            left: '50%',
            marginLeft: `-${pkg.centerPoint?.width / 2 || 2}px`,
            width: `${pkg.centerPoint?.width || 4}px`,
            opacity: 0.7,
          }}
        ></div>
      )}

      {debugMode && (
        <div className="absolute h-full w-1 bg-gray-400 opacity-40 z-0"></div>
      )}

      <div className={`z-10 px-2 font-semibold ${textColor} relative`}>
        <div className={pkg.status === 'missed' && pkg.wasUnprocessed ? 'fade-in' : ''}>{packageText}</div>
        {pkg.status !== 'missed' && pkg.status === 'unprocessed' && !pkg.hideQuestionMark && (
          <div className="absolute inset-0 flex items-center justify-center text-purple-800">
            ?
          </div>
        )}
      </div>

      {debugMode && (
        <>
          <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-50" />
          <div className="absolute right-0 top-0 w-1 h-full bg-blue-500 opacity-50" />

          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="bg-black text-white text-xs px-2 py-1 rounded-sm">
              {pkg.status} | {pkg.type}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default Package;
