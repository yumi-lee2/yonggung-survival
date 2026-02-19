import { GameState, Lane } from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, LANE_COUNT, LANE_WIDTH,
  PLAYER_Y, OBJECT_SIZE, BLINK_RATE,
  OBSTACLE_CONFIGS, ITEM_CONFIGS, PEARL_EMOJI, SEAWEED_EMOJI,
  BG_COLORS,
} from './constants';

const RABBIT_EMOJI = '🐰';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private emojiCache = new Map<string, HTMLCanvasElement>();
  private bgOffset = 0;
  private bgLines: Array<{ x: number; y: number; speed: number; alpha: number }> = [];
  private time = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Pre-render emojis
    const allEmojis = [
      RABBIT_EMOJI,
      ...OBSTACLE_CONFIGS.map(c => c.emoji),
      ...ITEM_CONFIGS.map(c => c.emoji),
      PEARL_EMOJI,
      SEAWEED_EMOJI,
      '🛡️',
    ];
    for (const emoji of allEmojis) {
      this.cacheEmoji(emoji, OBJECT_SIZE);
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

    // Apply screen shake
    ctx.save();
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
    this.drawItems(state);
    this.drawObstacles(state);
    this.drawPlayer(state);
    this.drawEffects(state);

    // Red flash overlay
    if (state.effects.redFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${state.effects.redFlash * 0.5})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }

  private drawBackground(state: GameState, dt: number) {
    const ctx = this.ctx;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, BG_COLORS.shallow);
    grad.addColorStop(0.4, BG_COLORS.mid);
    grad.addColorStop(0.7, BG_COLORS.deep);
    grad.addColorStop(1, BG_COLORS.abyss);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Speed lines
    this.bgOffset += state.scrollSpeed * dt;
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.08)';
    ctx.lineWidth = 1;
    for (const line of this.bgLines) {
      line.y = (line.y + state.scrollSpeed * line.speed * dt) % CANVAS_HEIGHT;
      ctx.globalAlpha = line.alpha * Math.min(1, state.scrollSpeed / 200);
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x, line.y + 20 + state.scrollSpeed * 0.1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Subtle bubbles
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

  private drawPlayer(state: GameState) {
    const p = state.player;

    // Dash trail
    for (const trail of state.effects.dashTrail) {
      const tx = trail.lane * LANE_WIDTH + LANE_WIDTH / 2;
      this.drawEmoji(RABBIT_EMOJI, tx, trail.y + 10, OBJECT_SIZE * 0.8, trail.alpha * 0.5);
    }

    // Blink during invincibility
    if (p.invincibleTimer > 0) {
      const blink = Math.sin(this.time * BLINK_RATE * Math.PI * 2) > 0;
      if (!blink) return;
    }

    const px = p.lane * LANE_WIDTH + LANE_WIDTH / 2;
    const py = PLAYER_Y;

    // Shield visual
    if (p.shieldActive) {
      this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(px, py, OBJECT_SIZE * 0.6, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
      this.ctx.fill();
    }

    // Magnet visual
    if (p.magnetTimer > 0) {
      this.ctx.strokeStyle = `rgba(255, 100, 100, ${0.2 + Math.sin(this.time * 4) * 0.15})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(px, py, LANE_WIDTH * 2.5, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Dash bob
    const dashBob = p.isDashing ? -8 : 0;
    this.drawEmoji(RABBIT_EMOJI, px, py + dashBob, OBJECT_SIZE);
  }

  private drawObstacles(state: GameState) {
    for (const obs of state.obstacles) {
      if (!obs.active) continue;
      const config = OBSTACLE_CONFIGS.find(c => c.type === obs.type)!;
      const ox = obs.lane * LANE_WIDTH + LANE_WIDTH / 2;
      let size = OBJECT_SIZE;

      // Pufferfish expanded
      if (obs.type === 'pufferfish' && obs.state > 0) {
        size = OBJECT_SIZE * 1.8;
      }

      // Shark warning indicator
      if (obs.type === 'shark' && obs.warned && obs.state === 0) {
        this.ctx.fillStyle = `rgba(255, 50, 50, ${0.3 + Math.sin(this.time * 10) * 0.2})`;
        this.ctx.fillRect(
          obs.lane * LANE_WIDTH, 0,
          LANE_WIDTH, CANVAS_HEIGHT,
        );
        // Warning text
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillStyle = `rgba(255, 100, 100, ${0.5 + Math.sin(this.time * 8) * 0.3})`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠️', ox, Math.min(obs.y + 40, CANVAS_HEIGHT * 0.3));
      }

      this.drawEmoji(config.emoji, ox, obs.y, size);
    }
  }

  private drawCollectibles(state: GameState) {
    for (const c of state.collectibles) {
      if (!c.active || c.collected) continue;
      const cx = c.lane * LANE_WIDTH + LANE_WIDTH / 2;
      const bob = Math.sin(this.time * 3 + c.id) * 3;
      const emoji = c.type === 'pearl' ? PEARL_EMOJI : SEAWEED_EMOJI;
      const size = c.type === 'pearl' ? OBJECT_SIZE * 0.55 : OBJECT_SIZE * 0.7;
      this.drawEmoji(emoji, cx, c.y + bob, size);
    }
  }

  private drawItems(state: GameState) {
    for (const item of state.items) {
      if (!item.active || item.collected) continue;
      const ix = item.lane * LANE_WIDTH + LANE_WIDTH / 2;
      const config = ITEM_CONFIGS.find(c => c.type === item.type)!;
      const pulse = 1 + Math.sin(this.time * 4) * 0.1;

      // Glow
      this.ctx.shadowColor = 'rgba(255, 255, 100, 0.5)';
      this.ctx.shadowBlur = 10;
      this.drawEmoji(config.emoji, ix, item.y, OBJECT_SIZE * 0.7 * pulse);
      this.ctx.shadowBlur = 0;
    }
  }

  private drawEffects(state: GameState) {
    const ctx = this.ctx;

    // Floating texts
    for (const ft of state.effects.floatingTexts) {
      ctx.font = ft.text === 'CLOSE!' ? 'bold 18px sans-serif' : 'bold 14px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
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
}
