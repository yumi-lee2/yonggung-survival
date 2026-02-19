'use client';

import { Difficulty, DifficultyConfig } from '@/lib/game/types';
import { DIFFICULTY_CONFIG } from '@/lib/game/constants';

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  highScores: Record<Difficulty, number>;
}

function DifficultyCard({
  difficulty,
  config,
  highScore,
  onSelect,
}: {
  difficulty: Difficulty;
  config: DifficultyConfig;
  highScore: number;
  onSelect: (d: Difficulty) => void;
}) {
  return (
    <button
      onClick={() => onSelect(difficulty)}
      className="group w-full p-5 rounded-xl border text-left transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{config.emoji}</span>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
        >
          {config.scoreMultiplier}x
        </span>
      </div>

      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {config.label}
      </h3>
      <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
        {config.description}
      </p>

      <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>{config.gridSize}x{config.gridSize}</span>
        <span>심복 {config.mineCount}</span>
        <span>{Math.floor(config.timeLimit / 60)}분</span>
      </div>

      {highScore > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            최고기록: <span style={{ color: '#ffd700' }}>{highScore}</span>
          </span>
        </div>
      )}
    </button>
  );
}

export default function DifficultySelect({ onSelect, highScores }: DifficultySelectProps) {
  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {difficulties.map((d) => (
        <DifficultyCard
          key={d}
          difficulty={d}
          config={DIFFICULTY_CONFIG[d]}
          highScore={highScores[d]}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
