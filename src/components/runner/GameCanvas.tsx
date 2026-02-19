'use client';

import { forwardRef } from 'react';

const GameCanvas = forwardRef<HTMLCanvasElement>(function GameCanvas(_, ref) {
  return (
    <canvas
      ref={ref}
      className="runner-canvas"
      tabIndex={0}
      style={{
        display: 'block',
        borderRadius: '12px',
        outline: 'none',
        touchAction: 'none',
      }}
    />
  );
});

export default GameCanvas;
