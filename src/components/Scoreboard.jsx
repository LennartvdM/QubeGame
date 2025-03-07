import React from 'react';

const Scoreboard = ({ score, autoPilot }) => {
  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md flex flex-col gap-2">
      <div className="text-center">
        <div className="text-sm text-gray-600">Safe</div>
        <div className="text-xl font-bold text-green-600">{score.safe}</div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-600">Threats</div>
        <div className="text-xl font-bold text-red-600">{score.malicious}</div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-600">Missed Threats</div>
        <div className="text-xl font-bold text-gray-600">{score.missed}</div>
      </div>
      <div className="mt-2 text-center">
        <div className={`text-xs font-semibold ${autoPilot ? 'text-purple-600' : 'text-gray-400'}`}>
          {autoPilot ? 'QUBE MODE ACTIVE' : 'MANUAL MODE'}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
