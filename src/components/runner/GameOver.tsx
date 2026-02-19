'use client';

import { GameOverState } from '@/hooks/useGameEngine';
import Button from '@/components/ui/Button';

interface GameOverProps {
  state: GameOverState;
  onRestart: () => void;
  onMenu: () => void;
  onShop: () => void;
}

export default function GameOver({ state, onRestart, onMenu, onShop }: GameOverProps) {
  return (
    <div className="gameover-overlay">
      <div className="gameover-card animate-fade-in-up">
        <div className="gameover-emoji">🐰💀</div>
        <h2 className="gameover-title">게임 오버</h2>

        {state.isNewRecord && (
          <div className="gameover-newrecord">
            🎉 새 기록!
          </div>
        )}

        <div className="gameover-stats-grid">
          <div className="gameover-stat">
            <span className="gameover-stat-label">거리</span>
            <span className="gameover-stat-value">{Math.floor(state.distance)}m</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat-label">점수</span>
            <span className="gameover-stat-value">⭐ {state.score}</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat-label">처치</span>
            <span className="gameover-stat-value">🗡️ {state.kills}</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat-label">콤보</span>
            <span className="gameover-stat-value">🔥 {state.maxCombo}</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat-label">구역</span>
            <span className="gameover-stat-value">{state.zoneName}</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat-label">최고기록</span>
            <span className="gameover-stat-value">⭐ {state.highScore}</span>
          </div>
        </div>

        <div className="gameover-buttons">
          <Button onClick={onRestart} variant="primary" size="lg">
            다시 하기
          </Button>
          <Button onClick={onShop} variant="secondary" size="md">
            🏪 상점
          </Button>
          <Button onClick={onMenu} variant="secondary" size="md">
            메뉴로
          </Button>
        </div>
      </div>
    </div>
  );
}
