'use client';

import { useEffect, useRef } from 'react';

export function useTimer(isRunning: boolean, onTick: () => void) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      tickRef.current();
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
