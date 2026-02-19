'use client';

import { useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/game/types';
import { useGame } from '@/hooks/useGame';
import { useTimer } from '@/hooks/useTimer';
import { useHighScores } from '@/hooks/useHighScores';
import Board from '@/components/game/Board';
import GameHeader from '@/components/game/GameHeader';
import GameOverModal from '@/components/game/GameOverModal';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficultyParam = searchParams.get('difficulty') as Difficulty | null;
  const difficulty: Difficulty = difficultyParam && ['easy', 'normal', 'hard'].includes(difficultyParam)
    ? difficultyParam
    : 'easy';

  const { state, initGame, handleTileClick, handleTileRightClick, tick } = useGame(difficulty);
  const { addScore, getTopScore } = useHighScores();

  const isPlaying = state.status === 'playing';
  useTimer(isPlaying, tick);

  // Save score on game over
  useEffect(() => {
    if (state.status === 'won' || state.status === 'lost') {
      if (state.score > 0) {
        addScore(state.difficulty, state.score, state.elapsedTime);
      }
    }
  }, [state.status, state.score, state.difficulty, state.elapsedTime, addScore]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') {
        initGame(difficulty);
      } else if (e.key === 'Escape') {
        router.push('/');
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [difficulty, initGame, router]);

  const handleRestart = useCallback(() => {
    initGame(difficulty);
  }, [difficulty, initGame]);

  const handleMenu = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <main className="bg-underwater min-h-screen flex flex-col items-center pt-4 pb-8 px-2 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bubble absolute rounded-full"
            style={{
              width: `${6 + i * 3}px`,
              height: `${6 + i * 3}px`,
              left: `${20 + i * 20}%`,
              bottom: '-20px',
              background: 'radial-gradient(circle at 30% 30%, rgba(100, 200, 255, 0.2), rgba(100, 200, 255, 0.03))',
              '--bubble-duration': `${7 + i * 2}s`,
              '--bubble-delay': `${i * 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 w-full">
        <GameHeader
          config={state.config}
          elapsedTime={state.elapsedTime}
          flagCount={state.flagCount}
          score={state.score}
          revealedCount={state.revealedCount}
          totalSafeTiles={state.totalSafeTiles}
        />
      </div>

      {/* Board */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <Board
          grid={state.grid}
          gridSize={state.config.gridSize}
          status={state.status}
          rabbitPosition={state.rabbitPosition}
          onTileClick={handleTileClick}
          onTileRightClick={handleTileRightClick}
        />
      </div>

      {/* Controls hint */}
      <div className="relative z-10 mt-4 flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>R: 재시작</span>
        <span>ESC: 메뉴</span>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        status={state.status}
        score={state.score}
        elapsedTime={state.elapsedTime}
        config={state.config}
        highScore={getTopScore(state.difficulty)}
        onRestart={handleRestart}
        onMenu={handleMenu}
      />
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="bg-underwater min-h-screen flex items-center justify-center">
        <div className="text-2xl" style={{ color: 'var(--text-secondary)' }}>
          용궁으로 이동 중...
        </div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
