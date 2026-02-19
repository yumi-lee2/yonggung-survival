'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameCanvas from '@/components/runner/GameCanvas';
import HUD from '@/components/runner/HUD';
import GameOver from '@/components/runner/GameOver';
import { useGameEngine } from '@/hooks/useGameEngine';

export default function RunnerPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { hud, gameOver, isRunning, startGame, restart } = useGameEngine(canvasRef);

  useEffect(() => {
    // Auto-start on mount
    const timer = setTimeout(() => startGame(), 100);
    return () => clearTimeout(timer);
  }, [startGame]);

  return (
    <main className="runner-page">
      <div className="runner-container">
        <HUD state={hud} />
        <GameCanvas ref={canvasRef} />

        {!isRunning && !gameOver && (
          <div className="runner-start-overlay" onClick={startGame}>
            <div className="runner-start-content animate-fade-in-up">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐰</div>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                탭하여 시작
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ←→ 이동 · Space 대시 · F 아이템
              </p>
            </div>
          </div>
        )}

        {gameOver && (
          <GameOver
            state={gameOver}
            onRestart={restart}
            onMenu={() => router.push('/')}
          />
        )}
      </div>
    </main>
  );
}
