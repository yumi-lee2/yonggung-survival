import { GameState, Lane } from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, LANE_COUNT, LANE_WIDTH,
  PLAYER_Y, OBJECT_SIZE, BLINK_RATE,
  OBSTACLE_CONFIGS, POWERUP_CONFIGS, CARROT_EMOJI, SEAWEED_EMOJI,
  ZONES, COMBO_TIERS, WAVE_PATTERN,
} from './constants';

const RABBIT_EMOJI = '🐰';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private emojiCache = new Map<string, HTMLCanvasElement>();
  private bgOffset = 0;
  private bgLines: Array<{ x: number; y: number; speed: number; alpha: number }> = [];
  private time = 0;
  private currentZoneColors: [string, string, string, string];
  private previousZoneColors: [string, string, string, string];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    this.currentZoneColors = ZONES[0].bgColors;
    this.previousZoneColors = ZONES[0].bgColors;

    // Pre-render emojis to cache
    const allEmojis = [
      RABBIT_EMOJI,
      ...OBSTACLE_CONFIGS.map(c => c.emoji),
      ...POWERUP_CONFIGS.map(c => c.emoji),
      CARROT_EMOJI,
      SEAWEED_EMOJI,
    ];
    for (const emoji of allEmojis) {
      this.cacheEmoji(emoji, 50);
    }

    // Background speed lines
    for (let i = 0; i < 20; i++) {
      this.bgLines.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.15,
      });
    }
  }

  private cacheEmoji(emoji: string, size: number) {
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const octx = off.getContext('2d')!;
    octx.font = `${size * 0.75}px serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(emoji, size / 2, size / 2);
    this.emojiCache.set(emoji, off);
  }

  private drawEmoji(emoji: string, x: number, y: number, size = OBJECT_SIZE, alpha = 1) {
    const cached = this.emojiCache.get(emoji);
    if (cached) {
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(cached, x - size / 2, y - size / 2, size, size);
      this.ctx.globalAlpha = 1;
    }
  }

  render(state: GameState, dt: number) {
    const ctx = this.ctx;
    this.time += dt;

    // Update zone colors for transition
    if (state.currentZone < ZONES.length) {
      const targetColors = ZONES[state.currentZone].bgColors;
      if (state.zoneTransitionProgress <= 0) {
        this.currentZoneColors = targetColors;
      }
    }

    ctx.save();

    // Screen shake
    if (state.effects.screenShake > 0) {
      const intensity = state.effects.screenShake * 10;
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
      );
    }

    this.drawBackground(state, dt);
    this.drawLanes();
    this.drawCollectibles(state);
    this.drawPowerUps(state);
    this.drawProjectiles(state);
    this.drawObstacles(state);
    this.drawPlayer(state);
    this.drawParticles(state);
    this.drawEffects(state);
    this.drawComboDisplay(state);
    this.drawFeverOverlay(state);
    this.drawZoneLabel(state);
    this.drawDangerVignette(state);

    // Red flash overlay
    if (state.effects.redFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${state.effects.redFlash * 0.5})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }

  private drawBackground(state: GameState, dt: number) {
    const ctx = this.ctx;

    // Determine colors (with zone transition lerp)
    let c0: string, c1: string, c2: string, c3: string;
    if (state.zoneTransitionProgress > 0) {
      const t = 1 - state.zoneTransitionProgress;
      c0 = this.lerpColor(this.previousZoneColors[0], this.currentZoneColors[0], t);
      c1 = this.lerpColor(this.previousZoneColors[1], this.currentZoneColors[1], t);
      c2 = this.lerpColor(this.previousZoneColors[2], this.currentZoneColors[2], t);
      c3 = this.lerpColor(this.previousZoneColors[3], this.currentZoneColors[3], t);
    } else {
      [c0, c1, c2, c3] = this.currentZoneColors;
    }

    // 4-stop linear gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, c0);
    grad.addColorStop(0.33, c1);
    grad.addColorStop(0.66, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Speed lines
    this.bgOffset += state.scrollSpeed * dt;
    const wavePhase = WAVE_PATTERN[state.wave.phaseIndex]?.phase ?? 'calm';
    const isIntense = wavePhase === 'intense';

    ctx.lineWidth = 1;
    for (const line of this.bgLines) {
      line.y = (line.y + state.scrollSpeed * line.speed * dt) % CANVAS_HEIGHT;
      const speedAlpha = line.alpha * Math.min(1, state.scrollSpeed / 200);
      ctx.globalAlpha = isIntense ? speedAlpha * 1.5 : speedAlpha;
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      const lineLen = isIntense
        ? 30 + state.scrollSpeed * 0.15
        : 20 + state.scrollSpeed * 0.1;
      ctx.lineTo(line.x, line.y + lineLen);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Fever golden tint
    if (state.fever.active) {
      ctx.fillStyle = 'rgba(255, 200, 50, 0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Subtle floating bubbles
    ctx.fillStyle = 'rgba(200, 230, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
      const bx = (Math.sin(this.time * 0.3 + i * 1.5) * 0.5 + 0.5) * CANVAS_WIDTH;
      const by = (this.bgOffset * 0.02 + i * 180) % CANVAS_HEIGHT;
      const br = 3 + Math.sin(this.time + i) * 2;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLanes() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < LANE_COUNT; i++) {
      const x = i * LANE_WIDTH;
      ctx.beginPath();
      ctx.setLineDash([8, 16]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private drawCollectibles(state: GameState) {
    for (const c of state.collectibles) {
      if (!c.active || c.collected) continue;
      const cx = c.lane * LANE_WIDTH + LANE_WIDTH / 2;
      if (c.type === 'carrot') {
        const bob = Math.sin(this.time * 3 + c.id) * 3;
        this.drawEmoji(CARROT_EMOJI, cx, c.y + bob, OBJECT_SIZE * 0.6);
      } else {
        // seaweed: slight sway
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(cx, c.y);
        ctx.rotate(Math.sin(this.time * 2 + c.id) * 0.15);
        this.drawEmoji(SEAWEED_EMOJI, 0, 0, OBJECT_SIZE * 0.7);
        ctx.restore();
      }
    }
  }

  private drawPowerUps(state: GameState) {
    const ctx = this.ctx;
    for (const pu of state.powerUps) {
      if (!pu.active || pu.collected) continue;
      const config = POWERUP_CONFIGS.find(c => c.type === pu.type);
      if (!config) continue;
      const px = pu.lane * LANE_WIDTH + LANE_WIDTH / 2;
      const pulse = 1 + Math.sin(this.time * 4) * 0.1;

      // Color-coded glow per type
      const glowColors: Record<string, string> = {
        mushroom: 'rgba(255, 100, 100, 0.6)',
        bubble:   'rgba(100, 200, 255, 0.6)',
        lightning:'rgba(255, 255, 100, 0.8)',
        vortex:   'rgba(180, 100, 255, 0.6)',
        fire:     'rgba(255, 150, 50, 0.7)',
        ice:      'rgba(150, 220, 255, 0.6)',
        diamond:  'rgba(100, 255, 200, 0.8)',
      };

      ctx.shadowColor = glowColors[pu.type] ?? 'rgba(255, 255, 100, 0.5)';
      ctx.shadowBlur = 14;
      this.drawEmoji(config.emoji, px, pu.y, OBJECT_SIZE * 0.75 * pulse);
      ctx.shadowBlur = 0;
    }
  }

  private drawProjectiles(state: GameState) {
    const ctx = this.ctx;
    for (const proj of state.projectiles) {
      if (!proj.active) continue;
      const px = proj.lane * LANE_WIDTH + LANE_WIDTH / 2;
      const size = proj.big ? OBJECT_SIZE * 1.0 : OBJECT_SIZE * 0.5;

      // Trail (2 fading copies below)
      for (let t = 1; t <= 2; t++) {
        const trailY = proj.y + t * 10;
        this.drawEmoji(CARROT_EMOJI, px, trailY, size * (1 - t * 0.25), 0.3 - t * 0.1);
      }

      // Main projectile with slight rotation
      ctx.save();
      ctx.translate(px, proj.y);
      ctx.rotate(Math.sin(this.time * 8 + proj.id) * 0.2);
      this.drawEmoji(CARROT_EMOJI, 0, 0, size);
      ctx.restore();
    }
  }

  private drawObstacles(state: GameState) {
    const ctx = this.ctx;
    for (const obs of state.obstacles) {
      if (!obs.active) continue;
      const config = OBSTACLE_CONFIGS.find(c => c.type === obs.type)!;
      const ox = obs.lane * LANE_WIDTH + LANE_WIDTH / 2;
      let size = OBJECT_SIZE;

      // Pufferfish expansion based on timer
      if (obs.type === 'pufferfish' && obs.state > 0) {
        size = OBJECT_SIZE * 1.8;
      }

      // Shark warning lane flash + warning symbol
      if (obs.type === 'shark' && obs.warned && obs.state === 0) {
        ctx.fillStyle = `rgba(255, 50, 50, ${0.3 + Math.sin(this.time * 10) * 0.2})`;
        ctx.fillRect(obs.lane * LANE_WIDTH, 0, LANE_WIDTH, CANVAS_HEIGHT);
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = `rgba(255, 100, 100, ${0.5 + Math.sin(this.time * 8) * 0.3})`;
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', ox, Math.min(obs.y + 40, CANVAS_HEIGHT * 0.3));
      }

      this.drawEmoji(config.emoji, ox, obs.y, size);
    }
  }

  private drawPlayer(state: GameState) {
    const ctx = this.ctx;
    const p = state.player;
    const px = p.lane * LANE_WIDTH + LANE_WIDTH / 2;
    const py = PLAYER_Y;

    // Dash trail
    for (const trail of state.effects.dashTrail) {
      const tx = trail.lane * LANE_WIDTH + LANE_WIDTH / 2;
      this.drawEmoji(RABBIT_EMOJI, tx, trail.y + 10, OBJECT_SIZE * 0.8, trail.alpha * 0.5);
    }

    // Invincibility blink
    if (p.invincibleTimer > 0) {
      const blink = Math.sin(this.time * BLINK_RATE * Math.PI * 2) > 0;
      if (!blink) return;
    }

    // Active effects rendering
    const hasEffect = (t: string) => p.activeEffects.some(e => e.type === t);

    // Bubble effect: circle around player
    if (hasEffect('bubble')) {
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + Math.sin(this.time * 3) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, OBJECT_SIZE * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ice effect: frost circle
    if (hasEffect('ice')) {
      ctx.strokeStyle = `rgba(150, 220, 255, ${0.4 + Math.sin(this.time * 2) * 0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, OBJECT_SIZE * 0.65, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fever: golden glow around player
    if (state.fever.active) {
      ctx.shadowColor = 'rgba(255, 220, 50, 0.9)';
      ctx.shadowBlur = 20;
    }

    // Mushroom: larger, slight glow
    let playerSize = OBJECT_SIZE;
    if (hasEffect('mushroom')) {
      playerSize = OBJECT_SIZE * 1.5;
      ctx.shadowColor = 'rgba(255, 100, 100, 0.5)';
      ctx.shadowBlur = 10;
    }

    // Bubble: smaller
    if (hasEffect('bubble')) {
      playerSize = OBJECT_SIZE * 0.7;
    }

    // Fire: fire particles around player
    if (hasEffect('fire')) {
      for (let i = 0; i < 4; i++) {
        const angle = this.time * 3 + (i * Math.PI * 2) / 4;
        const fx = px + Math.cos(angle) * OBJECT_SIZE * 0.6;
        const fy = py + Math.sin(angle) * OBJECT_SIZE * 0.6;
        ctx.fillStyle = `rgba(255, ${100 + i * 30}, 0, ${0.5 + Math.sin(this.time * 5 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Vortex: spinning visual (rotate player emoji)
    if (hasEffect('vortex')) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.time * 4);
      this.drawEmoji(RABBIT_EMOJI, 0, 0, playerSize);
      ctx.restore();
      ctx.shadowBlur = 0;
      return;
    }

    // Dash bob
    const dashBob = p.isDashing ? -8 : 0;
    this.drawEmoji(RABBIT_EMOJI, px, py + dashBob, playerSize);
    ctx.shadowBlur = 0;
  }

  private drawParticles(state: GameState) {
    const ctx = this.ctx;
    for (const particle of state.effects.particles) {
      const lifeRatio = particle.life / particle.maxLife;
      const size = particle.size * lifeRatio;
      ctx.globalAlpha = lifeRatio;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(size, 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawEffects(state: GameState) {
    const ctx = this.ctx;
    for (const ft of state.effects.floatingTexts) {
      const fontSize = ft.size ?? (ft.text === 'CLOSE!' ? 18 : 14);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawComboDisplay(state: GameState) {
    if (state.combo.count < 5) return;
    const ctx = this.ctx;

    // Determine tier
    let tier = COMBO_TIERS[0];
    for (const t of COMBO_TIERS) {
      if (state.combo.count >= t.threshold) tier = t;
    }

    // Color based on tier
    const tierIndex = COMBO_TIERS.indexOf(tier);
    const comboColors = ['#facc15', '#f97316', '#ef4444', '#a855f7'];
    const color = comboColors[Math.min(tierIndex, comboColors.length - 1)];

    // Combo number on upper-right
    const x = CANVAS_WIDTH - 60;
    const y = 80;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.92;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`${state.combo.count}`, x, y);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`x${tier.multiplier}`, x, y + 22);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Milestone label - large, center screen, fades with combo timer
    if (state.combo.count === tier.threshold) {
      // Show label when hitting milestone exactly
      const fadeAlpha = Math.min(1, state.combo.timer / 0.5);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.globalAlpha = fadeAlpha;
      if (tierIndex === 3) {
        // Legendary: rainbow
        const hue = (this.time * 120) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
      } else {
        ctx.fillStyle = color;
      }
      ctx.font = 'bold 42px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillText(tier.label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  private drawFeverOverlay(state: GameState) {
    if (!state.fever.active) return;
    const ctx = this.ctx;

    // Golden gradient overlay at low opacity
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, 'rgba(255, 220, 50, 0.08)');
    grad.addColorStop(0.5, 'rgba(255, 180, 0, 0.04)');
    grad.addColorStop(1, 'rgba(255, 220, 50, 0.08)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Rainbow border (animated hue shift)
    const hue = (this.time * 90) % 360;
    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

    // "FEVER!" text pulsing at center-top
    const pulse = 1 + Math.sin(this.time * 6) * 0.05;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(28 * pulse)}px sans-serif`;
    ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
    ctx.shadowColor = 'rgba(255, 200, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText('FEVER!', CANVAS_WIDTH / 2, 36);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawZoneLabel(state: GameState) {
    if (state.zoneLabelTimer <= 0) return;
    const ctx = this.ctx;
    const zone = ZONES[state.currentZone];
    if (!zone) return;

    // Fade in first 0.5s, fade out last 1s
    const totalDuration = 2.5; // assume 2.5s total label timer
    const elapsed = totalDuration - state.zoneLabelTimer;
    let alpha = 1;
    if (elapsed < 0.5) {
      alpha = elapsed / 0.5;
    } else if (state.zoneLabelTimer < 1) {
      alpha = state.zoneLabelTimer / 1;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    // Shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;

    // Zone emoji
    ctx.font = 'bold 48px serif';
    ctx.fillText(zone.emoji, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    // Zone label
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(zone.label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawDangerVignette(state: GameState) {
    if (state.player.hp !== 1) return;
    const ctx = this.ctx;
    const pulseAlpha = 0.25 + Math.sin(this.time * 3) * 0.15;

    const grad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.3,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.75,
    );
    grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
    grad.addColorStop(1, `rgba(255, 0, 0, ${pulseAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  resize(containerWidth: number, containerHeight: number): number {
    const scale = Math.min(
      containerWidth / CANVAS_WIDTH,
      containerHeight / CANVAS_HEIGHT,
      1.5,
    );
    this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    return scale;
  }

  // Set previous zone colors before transitioning
  setPreviousZoneColors(colors: [string, string, string, string]) {
    this.previousZoneColors = colors;
  }

  // Update current zone colors
  setCurrentZoneColors(colors: [string, string, string, string]) {
    this.currentZoneColors = colors;
  }

  // Helper: lerp between two hex colors
  private lerpColor(c1: string, c2: string, t: number): string {
    const r1 = this.hexToRgb(c1);
    const r2 = this.hexToRgb(c2);
    if (!r1 || !r2) return c2;
    const r = Math.round(r1.r + (r2.r - r1.r) * t);
    const g = Math.round(r1.g + (r2.g - r1.g) * t);
    const b = Math.round(r1.b + (r2.b - r1.b) * t);
    return this.rgbToHex(r, g, b);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return null;
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }
}
