'use client';

import { HUDState } from '@/hooks/useGameEngine';
import { DASH_COOLDOWN, FEVER_MAX_CHARGE, COMBO_TIERS, POWERUP_CONFIGS } from '@/lib/runner/constants';

interface HUDProps {
  state: HUDState;
}

function getPowerUpEmoji(type: string): string {
  const config = POWERUP_CONFIGS.find(c => c.type === type);
  return config?.emoji ?? '✨';
}

export default function HUD({ state }: HUDProps) {
  const dashPct = Math.max(0, 1 - state.dashCooldown / DASH_COOLDOWN);
  const feverPct = Math.min(1, state.feverCharge / FEVER_MAX_CHARGE);
  const isLowCarrots = state.carrots <= 2;

  // Find combo multiplier label
  const comboTier = [...COMBO_TIERS].reverse().find(t => state.combo >= t.threshold);
  const multiplierDisplay = comboTier ? comboTier.multiplier : state.comboMultiplier;

  return (
    <div className="hud-container" style={{ flexDirection: 'column', gap: '0.4rem', alignItems: 'stretch' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* HP hearts */}
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

        {/* Score */}
        <div className="hud-score">
          ⭐ {state.score}
        </div>

        {/* Carrot ammo */}
        <div className={`hud-carrots${isLowCarrots ? ' low' : ''}`}>
          🥕 {state.carrots}/{state.maxCarrots}
        </div>

        {/* Kills */}
        <div className="hud-kills">
          🗡️ {state.kills}
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

      {/* Middle row: combo + active effects */}
      {(state.combo >= 5 || state.activeEffects.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {state.combo >= 5 && (
            <div className="hud-combo">
              🔥 x{multiplierDisplay}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }}>
                ({state.combo} 콤보)
              </span>
            </div>
          )}
          {state.activeEffects.length > 0 && (
            <div className="hud-effects">
              {state.activeEffects.map((effect, i) => (
                <div key={`${effect.type}-${i}`} className="hud-effect-icon">
                  {getPowerUpEmoji(effect.type)}
                  <div className="hud-effect-timer">
                    <div
                      className="hud-effect-timer-fill"
                      style={{ width: `${(effect.remaining / effect.duration) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom: Fever bar + zone name */}
      <div className="hud-fever">
        <div className="hud-fever-bar">
          <div
            className={`hud-fever-fill${state.feverActive ? ' active' : ''}`}
            style={{ width: `${feverPct * 100}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px' }}>
          <div className="hud-fever-text">
            {state.feverActive ? '🔥 FEVER!' : feverPct >= 1 ? '✨ FEVER 준비!' : ''}
          </div>
          <div className="hud-zone">{state.zoneName}</div>
        </div>
      </div>
    </div>
  );
}
