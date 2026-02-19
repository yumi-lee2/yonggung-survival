'use client';

import { HUDState } from '@/hooks/useGameEngine';
import { DASH_COOLDOWN } from '@/lib/runner/constants';

interface HUDProps {
  state: HUDState;
}

const ITEM_EMOJI: Record<string, string> = {
  shield: '🛡️',
  lightning: '⚡',
  magnet: '🧲',
};

export default function HUD({ state }: HUDProps) {
  const dashPct = Math.max(0, 1 - state.dashCooldown / DASH_COOLDOWN);

  return (
    <div className="hud-container">
      {/* HP */}
      <div className="hud-hp">
        {Array.from({ length: state.maxHp }, (_, i) => (
          <span key={i} className={i < state.hp ? 'hud-heart active' : 'hud-heart'}>
            {i < state.hp ? '❤️' : '🖤'}
          </span>
        ))}
      </div>

      {/* Distance */}
      <div className="hud-distance">
        <span className="hud-distance-value">{Math.floor(state.distance)}</span>
        <span className="hud-distance-unit">m</span>
      </div>

      {/* Pearls */}
      <div className="hud-pearls">
        🔮 <span>{state.pearls}</span>
      </div>

      {/* Item slot */}
      <div className="hud-item">
        {state.item ? (
          <div className="hud-item-slot has-item" title="F 키 또는 화면 상단 탭">
            {ITEM_EMOJI[state.item]}
          </div>
        ) : (
          <div className="hud-item-slot empty">-</div>
        )}
      </div>

      {/* Dash cooldown */}
      <div className="hud-dash">
        <div className="hud-dash-bar">
          <div
            className="hud-dash-fill"
            style={{ width: `${dashPct * 100}%` }}
          />
        </div>
        <span className="hud-dash-label">대시</span>
      </div>
    </div>
  );
}
