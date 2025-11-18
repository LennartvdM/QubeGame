import React from 'react';
import { createRoot } from 'react-dom/client';
import PreciseCollisionGame from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('QubeGame root container not found');
}

const root = createRoot(container);

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.info('QubeGame bootstrap running', process.env.NODE_ENV);
}

root.render(
  <React.StrictMode>
    <PreciseCollisionGame />
  </React.StrictMode>
);
