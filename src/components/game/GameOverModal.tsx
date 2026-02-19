'use client';

import { GameStatus, DifficultyConfig } from '@/lib/game/types';
import { formatTime } from '@/hooks/useTimer';
import { RABBIT_EMOJI } from '@/lib/game/constants';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface GameOverModalProps {
  status: GameStatus;
  score: number;
  elapsedTime: number;
  config: DifficultyConfig;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverModal({
  status,
  score,
  elapsedTime,
  config,
  highScore,
  onRestart,
  onMenu,
}: GameOverModalProps) {
  const isOpen = status === 'won' || status === 'lost';
  const won = status === 'won';
  const isNewRecord = score > highScore && highScore > 0;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen}>
      <div className="text-center space-y-5">
        {/* Result emoji */}
        <div className={`text-6xl ${won ? 'rabbit-escape' : ''}`}>
          {won ? RABBIT_EMOJI : '🐙'}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {won ? '탈출 성공!' : '잡혔다!'}
        </h2>

        {/* Story text */}
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {won
            ? '토끼가 용궁에서 무사히 탈출했습니다! 이제 자유입니다!'
            : '용왕의 심복에게 발각되었습니다... 다시 도전하세요!'}
        </p>

        {/* Stats */}
        <div
          className="grid grid-cols-3 gap-3 p-4 rounded-xl"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              점수
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {score}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              시간
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              난이도
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {config.emoji}
            </div>
          </div>
        </div>

        {/* New record */}
        {isNewRecord && (
          <div
            className="py-2 px-4 rounded-lg text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
              color: '#1a1a1a',
            }}
          >
            NEW RECORD!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={onRestart} variant="primary" size="lg">
            다시 도전
          </Button>
          <Button onClick={onMenu} variant="secondary" size="lg">
            메뉴로
          </Button>
        </div>
      </div>
    </Modal>
  );
}
