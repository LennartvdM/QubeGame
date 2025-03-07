import React from 'react';

const ControlButtons = ({ debugMode, autoPilot, toggleDebugMode, toggleAutoPilot, conveyorSpeed }) => {
  return (
    <>
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={toggleDebugMode}
          className={`px-4 py-2 rounded-lg shadow-md font-medium
            ${debugMode ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}
        >
          {debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}
        </button>
        <button
          onClick={toggleAutoPilot}
          className={`px-4 py-2 rounded-lg shadow-md font-medium text-white ${autoPilot ? 'bg-purple-800 animate-pulse-subtle' : 'bg-purple-600'}`}
        >
          QUBE MODE
        </button>
      </div>

      {debugMode && (
        <div className="absolute bottom-4 right-4 bg-white px-2 py-1 rounded text-xs">
          Speed: {Math.round(conveyorSpeed)}
        </div>
      )}
    </>
  );
};

export default ControlButtons;
