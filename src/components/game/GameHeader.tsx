'use client';

import { RABBIT_EMOJI } from '@/lib/game/constants';
import { formatTime } from '@/hooks/useTimer';
import { DifficultyConfig } from '@/lib/game/types';

interface GameHeaderProps {
  config: DifficultyConfig;
  elapsedTime: number;
  flagCount: number;
  score: number;
  revealedCount: number;
  totalSafeTiles: number;
}

export default function GameHeader({
  config,
  elapsedTime,
  flagCount,
  score,
  revealedCount,
  totalSafeTiles,
}: GameHeaderProps) {
  const remainingTime = Math.max(0, config.timeLimit - elapsedTime);
  const isTimeLow = remainingTime <= 30;
  const remainingMines = config.mineCount - flagCount;
  const progress = totalSafeTiles > 0 ? (revealedCount / totalSafeTiles) * 100 : 0;

  return (
    <header className="w-full max-w-2xl mx-auto mb-4">
      <div
        className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl border"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Rabbit + difficulty */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{RABBIT_EMOJI}</span>
          <div className="text-sm">
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {config.label}
            </div>
            <div style={{ color: 'var(--text-muted)' }} className="text-xs">
              {config.description}
            </div>
          </div>
        </div>

        {/* Remaining mines */}
        <div className="text-center">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            남은 심복
          </div>
          <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {remainingMines}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            시간
          </div>
          <div
            className={`text-xl font-bold tabular-nums ${isTimeLow ? 'timer-warning' : ''}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {formatTime(remainingTime)}
          </div>
        </div>

        {/* Score */}
        <div className="text-center">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            점수
          </div>
          <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {score > 0 ? score : '—'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4fc3f7, #81c784)',
          }}
        />
      </div>
    </header>
  );
}
