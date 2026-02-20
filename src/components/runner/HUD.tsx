'use client';

import { HUDState } from '@/hooks/useGameEngine';
import { FEVER_MAX_CHARGE } from '@/lib/runner/constants';

interface HUDProps {
  state: HUDState;
}

export default function HUD({ state }: HUDProps) {
  const feverPct = Math.min(1, state.feverCharge / FEVER_MAX_CHARGE);
  const isLowCarrots = state.carrots <= 2;

  return (
    <div className="hud-container" style={{ flexDirection: 'column', gap: '0.4rem', alignItems: 'stretch' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
        {/* HP hearts - left */}
        <div className="hud-hp">
          {Array.from({ length: state.maxHp }, (_, i) => (
            <span key={i} className={i < state.hp ? 'hud-heart active' : 'hud-heart'}>
              {i < state.hp ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        {/* Stats - right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
          <div className="hud-distance">
            <span className="hud-distance-value">{Math.floor(state.distance)}</span>
            <span className="hud-distance-unit">m</span>
          </div>
          <div className="hud-score">
            ⭐ {state.score}
          </div>
          <div className={`hud-carrots${isLowCarrots ? ' low' : ''}`}>
            🥕 {state.carrots}/{state.maxCarrots}
          </div>
          <div className="hud-kills">
            🗡️ {state.kills}
          </div>
        </div>
      </div>

      {/* Fever gauge */}
      <div className="hud-fever">
        <div className="hud-fever-bar">
          <div
            className={`hud-fever-fill${state.feverActive ? ' active' : ''}`}
            style={{ width: `${feverPct * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
