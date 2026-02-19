import {
  GameState, Player, Obstacle, Collectible, Item, Effects, Lane, GameCallbacks,
} from './types';
import {
  LANE_COUNT, PLAYER_Y, OBJECT_SIZE, LANE_WIDTH, CANVAS_HEIGHT,
  MAX_HP, INITIAL_SPEED, MAX_SPEED, SPEED_RAMP_RATE,
  DASH_DURATION, DASH_COOLDOWN, DASH_DISTANCE,
  INVINCIBLE_DURATION, MAGNET_DURATION,
  OBSTACLE_CONFIGS, CLOSE_CALL_BONUS,
  SLOWMO_DURATION, SLOWMO_FACTOR,
} from './constants';
import { InputManager, InputAction } from './InputManager';
import { SpawnScheduler } from './SpawnScheduler';
import { checkCollisions } from './CollisionSystem';

export class GameEngine {
  state: GameState;
  private input: InputManager;
  private spawner: SpawnScheduler;
  private callbacks: GameCallbacks;
  private closeCalled = new Set<number>();

  // Audio callback hooks
  onSfx: ((name: string, data?: Record<string, number>) => void) | null = null;

  constructor(callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.input = new InputManager();
    this.spawner = new SpawnScheduler();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      player: {
        lane: 2 as Lane,
        y: PLAYER_Y,
        hp: MAX_HP,
        maxHp: MAX_HP,
        invincibleTimer: 0,
        dashCooldown: 0,
        isDashing: false,
        dashTimer: 0,
        heldItem: null,
        shieldActive: false,
        magnetTimer: 0,
        score: 0,
        pearls: 0,
        distance: 0,
      },
      obstacles: [],
      collectibles: [],
      items: [],
      scrollSpeed: INITIAL_SPEED,
      gameOver: false,
      isPaused: false,
      highScore: this.loadHighScore(),
      effects: {
        screenShake: 0,
        redFlash: 0,
        slowMotion: 0,
        dashTrail: [],
        floatingTexts: [],
      },
    };
  }

  attach(element: HTMLElement) {
    this.input.attach(element, this.handleInput.bind(this));
  }

  detach() {
    this.input.detach();
  }

  reset() {
    this.spawner.reset();
    this.closeCalled.clear();
    const hs = this.state.highScore;
    this.state = this.createInitialState();
    this.state.highScore = hs;
  }

  private handleInput(action: InputAction) {
    if (this.state.gameOver) return;
    const p = this.state.player;

    switch (action) {
      case 'left':
        if (p.lane > 0) {
          p.lane = (p.lane - 1) as Lane;
          this.onSfx?.('move');
        }
        break;
      case 'right':
        if (p.lane < LANE_COUNT - 1) {
          p.lane = (p.lane + 1) as Lane;
          this.onSfx?.('move');
        }
        break;
      case 'dash':
        if (p.dashCooldown <= 0 && !p.isDashing) {
          p.isDashing = true;
          p.dashTimer = DASH_DURATION;
          p.dashCooldown = DASH_COOLDOWN;
          p.invincibleTimer = Math.max(p.invincibleTimer, DASH_DURATION);
          this.onSfx?.('dash');
        }
        break;
      case 'useItem':
        this.useItem();
        break;
    }
  }

  private useItem() {
    const p = this.state.player;
    if (!p.heldItem) return;

    switch (p.heldItem) {
      case 'shield':
        p.shieldActive = true;
        this.onSfx?.('shield');
        break;
      case 'lightning':
        // Kill all active obstacles on screen
        for (const obs of this.state.obstacles) {
          if (obs.active && obs.y > 0 && obs.y < CANVAS_HEIGHT) {
            obs.active = false;
          }
        }
        this.state.effects.redFlash = 0.3; // white flash actually
        this.onSfx?.('lightning');
        break;
      case 'magnet':
        p.magnetTimer = MAGNET_DURATION;
        this.onSfx?.('magnet');
        break;
    }
    p.heldItem = null;
  }

  update(dt: number) {
    if (this.state.gameOver || this.state.isPaused) return;

    const s = this.state;
    const p = s.player;
    const eff = s.effects;

    // Slow motion
    let effectiveDt = dt;
    if (eff.slowMotion > 0) {
      effectiveDt *= SLOWMO_FACTOR;
      eff.slowMotion -= dt;
    }

    // Update speed
    s.scrollSpeed = Math.min(MAX_SPEED, s.scrollSpeed + SPEED_RAMP_RATE * effectiveDt);

    // Update distance
    p.distance += s.scrollSpeed * effectiveDt / 100; // convert to "meters"
    p.score = Math.floor(p.distance);

    // Timers
    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.magnetTimer > 0) p.magnetTimer -= dt;
    if (eff.screenShake > 0) eff.screenShake -= dt;
    if (eff.redFlash > 0) eff.redFlash -= dt;

    // Dash
    if (p.isDashing) {
      p.dashTimer -= dt;
      // Add trail
      eff.dashTrail.push({ lane: p.lane, y: PLAYER_Y, alpha: 1 });
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    }

    // Fade dash trail
    for (let i = eff.dashTrail.length - 1; i >= 0; i--) {
      eff.dashTrail[i].alpha -= dt * 4;
      if (eff.dashTrail[i].alpha <= 0) eff.dashTrail.splice(i, 1);
    }

    // Fade floating texts
    for (let i = eff.floatingTexts.length - 1; i >= 0; i--) {
      const ft = eff.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.5;
      if (ft.alpha <= 0) eff.floatingTexts.splice(i, 1);
    }

    // Spawn
    this.spawner.update(effectiveDt, p.distance, p.lane, s.obstacles, s.collectibles, s.items);

    // Move obstacles
    this.updateObstacles(effectiveDt, s.scrollSpeed, p.lane);

    // Move collectibles & items
    const scrollDelta = s.scrollSpeed * effectiveDt;
    for (const c of s.collectibles) {
      if (!c.active) continue;
      c.y += scrollDelta;
      // Magnet pull
      if (c.type === 'pearl' && !c.collected && p.magnetTimer > 0) {
        const dx = p.lane - c.lane;
        if (Math.abs(dx) <= 2) {
          c.lane = (c.lane + Math.sign(dx) * dt * 5) as unknown as Lane;
          c.lane = Math.round(Math.max(0, Math.min(4, c.lane))) as Lane;
        }
      }
    }
    for (const item of s.items) {
      if (item.active) item.y += scrollDelta;
    }

    // Collisions
    const col = checkCollisions(p, s.obstacles, s.collectibles, s.items);

    // Handle hits
    if (col.hitObstacles.length > 0 && p.invincibleTimer <= 0) {
      if (p.shieldActive) {
        p.shieldActive = false;
        p.invincibleTimer = 0.5;
        this.onSfx?.('shieldBreak');
      } else {
        p.hp -= 1;
        p.invincibleTimer = INVINCIBLE_DURATION;
        eff.screenShake = 0.3;
        eff.redFlash = 0.2;
        this.onSfx?.('hit');
        this.triggerHaptic('hit');

        if (p.hp <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    // Handle pearl collection
    for (const pearl of col.collectedPearls) {
      pearl.collected = true;
      pearl.active = false;
      p.pearls += 1;
      this.onSfx?.('pearl', { combo: p.pearls });
      this.triggerHaptic('pearl');
      const px = pearl.lane * LANE_WIDTH + LANE_WIDTH / 2;
      eff.floatingTexts.push({
        text: '+1', x: px, y: pearl.y, alpha: 1, vy: -60,
        color: '#e0b0ff',
      });
    }

    // Handle seaweed collection
    for (const sw of col.collectedSeaweed) {
      sw.collected = true;
      sw.active = false;
      if (p.hp < p.maxHp) {
        p.hp += 1;
        this.onSfx?.('heal');
        const sx = sw.lane * LANE_WIDTH + LANE_WIDTH / 2;
        eff.floatingTexts.push({
          text: '+❤️', x: sx, y: sw.y, alpha: 1, vy: -50,
          color: '#ff6b6b',
        });
      }
    }

    // Handle item collection
    for (const item of col.collectedItems) {
      item.collected = true;
      item.active = false;
      p.heldItem = item.type;
      this.onSfx?.('itemPickup');
    }

    // Close calls
    for (const obs of col.closeCalls) {
      if (!this.closeCalled.has(obs.id)) {
        this.closeCalled.add(obs.id);
        p.score += CLOSE_CALL_BONUS;
        const ox = obs.lane * LANE_WIDTH + LANE_WIDTH / 2;
        eff.floatingTexts.push({
          text: 'CLOSE!', x: ox, y: obs.y - 20, alpha: 1, vy: -40,
          color: '#ffd700',
        });
        this.onSfx?.('closeCall');
      }
    }

    // Cleanup offscreen
    s.obstacles = s.obstacles.filter(o => o.active && o.y < CANVAS_HEIGHT + 100);
    s.collectibles = s.collectibles.filter(c => c.active && c.y < CANVAS_HEIGHT + 100);
    s.items = s.items.filter(i => i.active && i.y < CANVAS_HEIGHT + 100);

    // Callback
    this.callbacks.onScoreUpdate(p.distance, p.pearls, p.hp, p.heldItem, p.dashCooldown);
  }

  private updateObstacles(dt: number, scrollSpeed: number, playerLane: Lane) {
    for (const obs of this.state.obstacles) {
      if (!obs.active) continue;

      const config = OBSTACLE_CONFIGS.find(c => c.type === obs.type)!;
      obs.y += scrollSpeed * config.speed * dt;

      switch (obs.type) {
        case 'crab': {
          // Patrol left/right
          obs.timer += dt;
          if (obs.timer >= 0.8) {
            obs.timer = 0;
            const newLane = obs.lane + obs.state;
            if (newLane < 0 || newLane >= LANE_COUNT) {
              obs.state = -obs.state;
            } else {
              obs.lane = newLane as Lane;
            }
          }
          break;
        }
        case 'jellyfish': {
          // Float up and down
          obs.timer += dt * 3;
          obs.y += Math.sin(obs.timer) * 30 * dt;
          break;
        }
        case 'pufferfish': {
          // Periodic expansion
          obs.timer += dt;
          const cycle = obs.timer % 3;
          obs.state = cycle > 2 ? 1 : 0; // expanded in last second of 3-sec cycle
          break;
        }
        case 'squid': {
          // Track player lane
          obs.timer += dt;
          if (obs.timer >= 0.5) {
            obs.timer = 0;
            if (obs.lane < playerLane && obs.lane < LANE_COUNT - 1) obs.lane = (obs.lane + 1) as Lane;
            else if (obs.lane > playerLane && obs.lane > 0) obs.lane = (obs.lane - 1) as Lane;
          }
          break;
        }
        case 'shark': {
          // Warning then charge
          if (!obs.warned && obs.y > 0) {
            obs.warned = true;
            obs.timer = 0;
            this.onSfx?.('sharkWarning');
          }
          if (obs.warned) {
            obs.timer += dt;
            if (obs.timer > 0.8 && obs.state === 0) {
              obs.state = 1; // charging
            }
            if (obs.state === 1) {
              obs.y += scrollSpeed * 2 * dt; // extra speed when charging
            }
          }
          break;
        }
      }
    }
  }

  private gameOver() {
    const s = this.state;
    s.effects.slowMotion = SLOWMO_DURATION;
    this.onSfx?.('gameOver');

    setTimeout(() => {
      s.gameOver = true;
      const best = Math.max(s.highScore, s.player.score);
      s.highScore = best;
      this.saveHighScore(best);
      this.callbacks.onGameOver(s.player.distance, s.player.pearls);
    }, SLOWMO_DURATION * 1000 + 300);
  }

  private triggerHaptic(type: 'hit' | 'pearl' | 'dash') {
    if (!navigator.vibrate) return;
    switch (type) {
      case 'pearl': navigator.vibrate(5); break;
      case 'hit': navigator.vibrate([50, 30, 100]); break;
      case 'dash': navigator.vibrate(20); break;
    }
  }

  private loadHighScore(): number {
    try {
      return parseInt(localStorage.getItem('runner-highscore') || '0', 10);
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number) {
    try {
      localStorage.setItem('runner-highscore', String(score));
    } catch { /* noop */ }
  }
}
