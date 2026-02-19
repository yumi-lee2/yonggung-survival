import {
  GameState, Player, Obstacle, Projectile, ActiveEffect,
  Lane, GameCallbacks, HUDData, GameOverData, PowerUpType,
} from './types';
import {
  LANE_COUNT, PLAYER_Y, OBJECT_SIZE, LANE_WIDTH, CANVAS_HEIGHT,
  INITIAL_SPEED, MAX_SPEED, SPEED_RAMP_RATE,
  DASH_DURATION, DASH_COOLDOWN,
  DASH_BURST_INTERVAL, DASH_BURST_COUNT,
  INVINCIBLE_DURATION,
  OBSTACLE_CONFIGS,
  CLOSE_CALL_BONUS, CLOSE_CALL_THRESHOLD,
  KILL_SCORES,
  COMBO_TIMEOUT, COMBO_TIERS,
  FEVER_CHARGE_PER_KILL, FEVER_CHARGE_PER_COMBO, FEVER_MAX_CHARGE,
  FEVER_DURATION, FEVER_SPEED_BOOST, FEVER_SCORE_MULTIPLIER,
  CARROT_REFILL_AMOUNT,
  ZONES, WAVE_PATTERN,
  OBSTACLE_PARTICLE_COLORS,
  SLOWMO_DURATION, SLOWMO_FACTOR,
} from './constants';
import { InputManager, InputAction } from './InputManager';
import { SpawnScheduler } from './SpawnScheduler';
import { checkCollisions } from './CollisionSystem';
import { loadSave, addScore } from '../storage/SaveData';
import {
  getMaxHP, getStartCarrots, getMaxCarrots,
  getPierceChance, getFeverChargeBonus,
  getStartShieldDuration, getCarrotSpeedMultiplier,
} from '../shop/upgrades';

let projectileId = 10000;
function nextProjectileId(): number {
  return projectileId++;
}

export class GameEngine {
  state: GameState;
  private input: InputManager;
  private spawner: SpawnScheduler;
  private callbacks: GameCallbacks;
  private closeCalled = new Set<number>();

  // Upgrade-derived private fields
  private pierceChance: number;
  private carrotSpeedMult: number;
  private feverChargeBonus: number;
  private maxCarrots: number;

  // Auto-fire timers
  private feverFireTimer = 0;
  private fireEffectTimer = 0;

  // Dash burst tracking
  private dashBurstAccum = 0;
  private dashBurstShotsFired = 0;

  // Distance milestones
  private lastMilestone = 0;

  // Audio callback hook
  onSfx: ((name: string, data?: Record<string, number>) => void) | null = null;

  constructor(callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.input = new InputManager();
    this.spawner = new SpawnScheduler();

    const save = loadSave();
    const maxHp = getMaxHP(save);
    const startCarrots = getStartCarrots(save);
    this.maxCarrots = getMaxCarrots(save);
    this.pierceChance = getPierceChance(save);
    this.carrotSpeedMult = getCarrotSpeedMultiplier(save);
    this.feverChargeBonus = getFeverChargeBonus(save);
    const invincibleStart = getStartShieldDuration(save);

    this.state = {
      player: {
        lane: 2 as Lane,
        y: PLAYER_Y,
        hp: maxHp,
        maxHp,
        invincibleTimer: invincibleStart,
        dashCooldown: 0,
        isDashing: false,
        dashTimer: 0,
        carrots: startCarrots,
        maxCarrots: this.maxCarrots,
        activeEffects: [],
        score: 0,
        kills: 0,
        distance: 0,
      },
      obstacles: [],
      collectibles: [],
      powerUps: [],
      projectiles: [],
      scrollSpeed: INITIAL_SPEED,
      baseScrollSpeed: INITIAL_SPEED,
      gameOver: false,
      isPaused: false,
      highScore: save.highScore,
      combo: { count: 0, timer: 0, maxCombo: 0 },
      fever: { charge: 0, active: false, timer: 0 },
      wave: { phaseIndex: 0, timer: WAVE_PATTERN[0].duration, cycle: 0 },
      currentZone: 0,
      zoneTransitionProgress: 0,
      zoneLabelTimer: 0,
      dashBurstTimer: 0,
      effects: {
        screenShake: 0,
        redFlash: 0,
        slowMotion: 0,
        dashTrail: [],
        floatingTexts: [],
        particles: [],
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
    this.feverFireTimer = 0;
    this.fireEffectTimer = 0;
    this.dashBurstAccum = 0;
    this.dashBurstShotsFired = 0;
    this.lastMilestone = 0;
    projectileId = 10000;

    const save = loadSave();
    const maxHp = getMaxHP(save);
    const startCarrots = getStartCarrots(save);
    this.maxCarrots = getMaxCarrots(save);
    this.pierceChance = getPierceChance(save);
    this.carrotSpeedMult = getCarrotSpeedMultiplier(save);
    this.feverChargeBonus = getFeverChargeBonus(save);
    const invincibleStart = getStartShieldDuration(save);

    const hs = this.state.highScore;
    this.state = {
      player: {
        lane: 2 as Lane,
        y: PLAYER_Y,
        hp: maxHp,
        maxHp,
        invincibleTimer: invincibleStart,
        dashCooldown: 0,
        isDashing: false,
        dashTimer: 0,
        carrots: startCarrots,
        maxCarrots: this.maxCarrots,
        activeEffects: [],
        score: 0,
        kills: 0,
        distance: 0,
      },
      obstacles: [],
      collectibles: [],
      powerUps: [],
      projectiles: [],
      scrollSpeed: INITIAL_SPEED,
      baseScrollSpeed: INITIAL_SPEED,
      gameOver: false,
      isPaused: false,
      highScore: hs,
      combo: { count: 0, timer: 0, maxCombo: 0 },
      fever: { charge: 0, active: false, timer: 0 },
      wave: { phaseIndex: 0, timer: WAVE_PATTERN[0].duration, cycle: 0 },
      currentZone: 0,
      zoneTransitionProgress: 0,
      zoneLabelTimer: 0,
      dashBurstTimer: 0,
      effects: {
        screenShake: 0,
        redFlash: 0,
        slowMotion: 0,
        dashTrail: [],
        floatingTexts: [],
        particles: [],
      },
    };
  }

  // --- Input Handling ---

  private handleInput(action: InputAction) {
    if (this.state.gameOver) return;
    const p = this.state.player;

    switch (action) {
      case 'left': {
        const hasVortex = this.hasEffect('vortex');
        const effectiveAction = hasVortex ? 'right' : 'left';
        const moveAmount = this.hasEffect('fire') ? 2 : 1;
        if (effectiveAction === 'left') {
          const newLane = Math.max(0, p.lane - moveAmount);
          if (newLane !== p.lane) {
            p.lane = newLane as Lane;
            this.onSfx?.('move');
          }
        } else {
          const newLane = Math.min(LANE_COUNT - 1, p.lane + moveAmount);
          if (newLane !== p.lane) {
            p.lane = newLane as Lane;
            this.onSfx?.('move');
          }
        }
        this.fireCarrot(p.lane);
        break;
      }
      case 'right': {
        const hasVortex = this.hasEffect('vortex');
        const effectiveAction = hasVortex ? 'left' : 'right';
        const moveAmount = this.hasEffect('fire') ? 2 : 1;
        if (effectiveAction === 'right') {
          const newLane = Math.min(LANE_COUNT - 1, p.lane + moveAmount);
          if (newLane !== p.lane) {
            p.lane = newLane as Lane;
            this.onSfx?.('move');
          }
        } else {
          const newLane = Math.max(0, p.lane - moveAmount);
          if (newLane !== p.lane) {
            p.lane = newLane as Lane;
            this.onSfx?.('move');
          }
        }
        this.fireCarrot(p.lane);
        break;
      }
      case 'dash':
        if (p.dashCooldown <= 0 && !p.isDashing) {
          p.isDashing = true;
          p.dashTimer = DASH_DURATION;
          p.dashCooldown = DASH_COOLDOWN;
          p.invincibleTimer = Math.max(p.invincibleTimer, DASH_DURATION);
          this.state.dashBurstTimer = DASH_DURATION;
          this.dashBurstAccum = 0;
          this.dashBurstShotsFired = 0;
          this.onSfx?.('dash');
        }
        break;
      // useItem removed -- items are auto-applied now
    }
  }

  // --- Projectile Firing ---

  private fireCarrot(lane: Lane | number) {
    const p = this.state.player;
    const clampedLane = Math.max(0, Math.min(LANE_COUNT - 1, Math.round(lane))) as Lane;

    // Can't fire during bubble effect
    if (this.hasEffect('bubble')) return;

    // Check ammo (fever = infinite ammo)
    if (!this.state.fever.active) {
      if (p.carrots <= 0) return;
      p.carrots--;
    }

    const proj: Projectile = {
      id: nextProjectileId(),
      lane: clampedLane,
      y: PLAYER_Y - 20,
      speed: this.state.scrollSpeed * this.carrotSpeedMult,
      big: this.hasEffect('mushroom'),
      pierceLeft: Math.random() < this.pierceChance ? 1 : 0,
      width: OBJECT_SIZE * 0.5,
      height: OBJECT_SIZE * 0.5,
      active: true,
    };

    this.state.projectiles.push(proj);
    this.onSfx?.('carrotFire');
  }

  // --- Effect Check ---

  private hasEffect(type: PowerUpType): boolean {
    return this.state.player.activeEffects.some(e => e.type === type && e.remaining > 0);
  }

  // --- Combo Multiplier ---

  private getComboMultiplier(): number {
    const count = this.state.combo.count;
    let multiplier = 1;
    for (const tier of COMBO_TIERS) {
      if (count >= tier.threshold) {
        multiplier = tier.multiplier;
      }
    }
    return multiplier;
  }

  // --- Score helper for kills ---

  private processKill(obs: Obstacle, fromProjectile: boolean) {
    const s = this.state;
    const p = s.player;
    const eff = s.effects;

    const baseKillScore = KILL_SCORES[obs.type] ?? 10;
    const comboMult = this.getComboMultiplier();
    const feverMult = s.fever.active ? FEVER_SCORE_MULTIPLIER : 1;
    const diamondMult = this.hasEffect('diamond') ? 3 : 1;
    const killScore = baseKillScore * comboMult * feverMult * diamondMult;

    p.score += killScore;
    p.kills++;

    // Refill a carrot on kill (not during fever, since ammo is infinite then)
    if (!s.fever.active && fromProjectile) {
      p.carrots = Math.min(this.maxCarrots, p.carrots + 1);
    }

    // Combo
    s.combo.count++;
    s.combo.timer = COMBO_TIMEOUT;
    s.combo.maxCombo = Math.max(s.combo.maxCombo, s.combo.count);

    // Fever charge
    const chargeGain =
      (FEVER_CHARGE_PER_KILL + FEVER_CHARGE_PER_COMBO * s.combo.count) * this.feverChargeBonus;
    s.fever.charge = Math.min(FEVER_MAX_CHARGE, s.fever.charge + chargeGain);

    // Activate fever if fully charged
    if (s.fever.charge >= FEVER_MAX_CHARGE && !s.fever.active) {
      s.fever.active = true;
      s.fever.timer = FEVER_DURATION;
      s.fever.charge = FEVER_MAX_CHARGE;
      this.onSfx?.('feverStart');
    }

    // Spawn particles at obstacle position
    const ox = obs.lane * LANE_WIDTH + LANE_WIDTH / 2;
    const colors = OBSTACLE_PARTICLE_COLORS[obs.type] ?? ['#ffffff'];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 80 + Math.random() * 60;
      eff.particles.push({
        x: ox,
        y: obs.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color: colors[i % colors.length],
        size: 3 + Math.random() * 3,
      });
    }

    // Floating text with score
    eff.floatingTexts.push({
      text: `+${killScore}`,
      x: ox,
      y: obs.y,
      alpha: 1,
      vy: -70,
      color: s.fever.active ? '#ff4500' : '#ffd700',
      size: killScore >= 100 ? 18 : 14,
    });

    this.onSfx?.('enemyKill');

    // Check combo milestone
    for (const tier of COMBO_TIERS) {
      if (s.combo.count === tier.threshold) {
        eff.floatingTexts.push({
          text: `${tier.label} x${tier.multiplier}`,
          x: LANE_WIDTH * 2.5,
          y: PLAYER_Y - 80,
          alpha: 1,
          vy: -50,
          color: '#ff69b4',
          size: 20,
        });
        this.onSfx?.('comboMilestone');
        break;
      }
    }
  }

  // --- Main Update Loop ---

  update(dt: number) {
    const s = this.state;
    if (s.gameOver || s.isPaused) return;

    const p = s.player;
    const eff = s.effects;

    // Slow motion
    let effectiveDt = dt;
    if (eff.slowMotion > 0) {
      effectiveDt *= SLOWMO_FACTOR;
      eff.slowMotion -= dt;
    }

    // Wave speed multiplier
    const waveConfig = WAVE_PATTERN[s.wave.phaseIndex] ?? WAVE_PATTERN[0];
    const waveSpeedMult = waveConfig.speedMultiplier;

    // Fever speed boost
    const feverSpeedMult = s.fever.active ? FEVER_SPEED_BOOST : 1;

    // Ice slowdown
    const iceSlowdown = this.hasEffect('ice') ? 0.5 : 1;

    // Ramp base scroll speed
    s.baseScrollSpeed = Math.min(MAX_SPEED, s.baseScrollSpeed + SPEED_RAMP_RATE * effectiveDt);

    // Compute actual scroll speed
    s.scrollSpeed = s.baseScrollSpeed * waveSpeedMult * feverSpeedMult * iceSlowdown;

    // Update distance
    p.distance += s.scrollSpeed * effectiveDt / 100;

    // Base distance score (accumulated, not recalculated)
    const distanceScore = Math.floor(p.distance);
    // Score includes both distance + kill-based score. Kill score is added in processKill.
    // We only add distance delta here.
    const prevDistScore = Math.floor(p.distance - s.scrollSpeed * effectiveDt / 100);
    if (distanceScore > prevDistScore) {
      p.score += distanceScore - prevDistScore;
    }

    // --- Timers ---
    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (eff.screenShake > 0) eff.screenShake -= dt;
    if (eff.redFlash > 0) eff.redFlash -= dt;

    // --- Dash ---
    if (p.isDashing) {
      p.dashTimer -= dt;
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

    // --- Dash burst ---
    if (s.dashBurstTimer > 0) {
      this.dashBurstAccum += dt;
      while (
        this.dashBurstAccum >= DASH_BURST_INTERVAL &&
        this.dashBurstShotsFired < DASH_BURST_COUNT
      ) {
        this.dashBurstAccum -= DASH_BURST_INTERVAL;
        this.dashBurstShotsFired++;
        const burstLane = Math.floor(Math.random() * LANE_COUNT) as Lane;
        this.fireCarrot(burstLane);
      }
      s.dashBurstTimer -= dt;
      if (s.dashBurstTimer <= 0) {
        s.dashBurstTimer = 0;
      }
    }

    // --- Fever auto-fire ---
    if (s.fever.active) {
      this.feverFireTimer += dt;
      if (this.feverFireTimer >= 0.1) {
        this.feverFireTimer -= 0.1;
        // Fire 3 carrots in fan around player lane
        const lanes = [
          Math.max(0, p.lane - 1),
          p.lane,
          Math.min(LANE_COUNT - 1, p.lane + 1),
        ];
        for (const l of lanes) {
          this.fireCarrot(l);
        }
      }
    } else {
      this.feverFireTimer = 0;
    }

    // --- Fire effect auto-fire ---
    if (this.hasEffect('fire')) {
      this.fireEffectTimer += dt;
      if (this.fireEffectTimer >= 0.15) {
        this.fireEffectTimer -= 0.15;
        const lanes = [
          Math.max(0, p.lane - 1),
          p.lane,
          Math.min(LANE_COUNT - 1, p.lane + 1),
        ];
        for (const l of lanes) {
          this.fireCarrot(l);
        }
      }
    } else {
      this.fireEffectTimer = 0;
    }

    // --- Combo timer ---
    if (s.combo.count > 0) {
      s.combo.timer -= dt;
      if (s.combo.timer <= 0) {
        s.combo.count = 0;
        s.combo.timer = 0;
      }
    }

    // --- Fever timer ---
    if (s.fever.active) {
      s.fever.timer -= dt;
      if (s.fever.timer <= 0) {
        s.fever.active = false;
        s.fever.charge = 0;
        s.fever.timer = 0;
      }
    }

    // --- Active effects timer ---
    for (let i = p.activeEffects.length - 1; i >= 0; i--) {
      p.activeEffects[i].remaining -= dt;
      if (p.activeEffects[i].remaining <= 0) {
        p.activeEffects.splice(i, 1);
      }
    }

    // --- Floating texts ---
    for (let i = eff.floatingTexts.length - 1; i >= 0; i--) {
      const ft = eff.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.5;
      if (ft.alpha <= 0) eff.floatingTexts.splice(i, 1);
    }

    // --- Particles ---
    for (let i = eff.particles.length - 1; i >= 0; i--) {
      const part = eff.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      if (part.life <= 0) eff.particles.splice(i, 1);
    }

    // --- Spawn ---
    this.spawner.update(effectiveDt, p.distance, p.lane, s, s.wave, s.currentZone);

    // --- Move obstacles ---
    this.updateObstacles(effectiveDt, s.scrollSpeed, p.lane);

    // --- Move collectibles & power-ups ---
    const scrollDelta = s.scrollSpeed * effectiveDt;
    for (const c of s.collectibles) {
      if (c.active) c.y += scrollDelta;
    }
    for (const pu of s.powerUps) {
      if (pu.active) pu.y += scrollDelta;
    }

    // --- Move projectiles upward ---
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const proj = s.projectiles[i];
      if (!proj.active) {
        s.projectiles.splice(i, 1);
        continue;
      }
      proj.y -= proj.speed * effectiveDt;
      if (proj.y < -50) {
        s.projectiles.splice(i, 1);
      }
    }

    // --- Collisions ---
    const col = checkCollisions(
      p,
      s.obstacles,
      s.collectibles,
      s.powerUps,
      s.projectiles,
      this.hasEffect('mushroom'),
      this.hasEffect('bubble'),
      s.fever.active,
    );

    // --- Handle player hits ---
    if (col.hitObstacles.length > 0 && p.invincibleTimer <= 0) {
      p.hp -= 1;
      p.invincibleTimer = INVINCIBLE_DURATION;
      eff.screenShake = 0.3;
      eff.redFlash = 0.2;
      // Reset combo on hit
      s.combo.count = 0;
      s.combo.timer = 0;
      this.onSfx?.('hit');
      this.triggerHaptic('hit');

      if (p.hp <= 0) {
        this.triggerGameOver();
        return;
      }
    }

    // --- Handle projectile hits ---
    for (const hit of col.projectileHits) {
      const { projectile, obstacle } = hit;
      // obstacle.active is already set to false in CollisionSystem
      if (projectile.pierceLeft > 0) {
        projectile.pierceLeft--;
      } else {
        projectile.active = false;
      }
      this.processKill(obstacle, true);
    }

    // --- Handle fever contact kills ---
    for (const obs of col.feverKills) {
      obs.active = false;
      this.processKill(obs, false);
    }

    // --- Handle carrot collection ---
    for (const c of col.collectedCarrots) {
      c.collected = true;
      c.active = false;
      p.carrots = Math.min(this.maxCarrots, p.carrots + CARROT_REFILL_AMOUNT);
      const cx = c.lane * LANE_WIDTH + LANE_WIDTH / 2;
      eff.floatingTexts.push({
        text: '+\uD83E\uDD55', // carrot emoji
        x: cx,
        y: c.y,
        alpha: 1,
        vy: -60,
        color: '#ff8c00',
      });
      this.onSfx?.('carrotPickup');
    }

    // --- Handle seaweed collection ---
    for (const sw of col.collectedSeaweed) {
      sw.collected = true;
      sw.active = false;
      if (p.hp < p.maxHp) {
        p.hp += 1;
        this.onSfx?.('heal');
        const sx = sw.lane * LANE_WIDTH + LANE_WIDTH / 2;
        eff.floatingTexts.push({
          text: '+\u2764\uFE0F', // heart emoji
          x: sx,
          y: sw.y,
          alpha: 1,
          vy: -50,
          color: '#ff6b6b',
        });
      }
    }

    // --- Handle power-up collection ---
    for (const pu of col.collectedPowerUps) {
      pu.collected = true;
      pu.active = false;
      this.applyPowerUp(pu.type);
    }

    // --- Close calls ---
    for (const obs of col.closeCalls) {
      if (!this.closeCalled.has(obs.id)) {
        this.closeCalled.add(obs.id);
        p.score += CLOSE_CALL_BONUS;
        const ox = obs.lane * LANE_WIDTH + LANE_WIDTH / 2;
        eff.floatingTexts.push({
          text: 'CLOSE!',
          x: ox,
          y: obs.y - 20,
          alpha: 1,
          vy: -40,
          color: '#ffd700',
        });
        this.onSfx?.('closeCall');
      }
    }

    // --- Update zone ---
    let newZone = 0;
    for (let i = ZONES.length - 1; i >= 0; i--) {
      if (p.distance >= ZONES[i].startDistance) {
        newZone = i;
        break;
      }
    }
    if (newZone !== s.currentZone) {
      s.currentZone = newZone;
      s.zoneTransitionProgress = 1;
      s.zoneLabelTimer = 2.5;
      this.onSfx?.('zoneChange');
    }

    // Zone transition fade
    if (s.zoneTransitionProgress > 0) {
      s.zoneTransitionProgress -= dt * 0.5;
      if (s.zoneTransitionProgress < 0) s.zoneTransitionProgress = 0;
    }

    // Zone label fade
    if (s.zoneLabelTimer > 0) {
      s.zoneLabelTimer -= dt;
      if (s.zoneLabelTimer < 0) s.zoneLabelTimer = 0;
    }

    // --- Update wave ---
    s.wave.timer -= dt;
    if (s.wave.timer <= 0) {
      s.wave.phaseIndex = (s.wave.phaseIndex + 1) % WAVE_PATTERN.length;
      s.wave.timer = WAVE_PATTERN[s.wave.phaseIndex].duration;
      if (s.wave.phaseIndex === 0) {
        s.wave.cycle++;
      }
    }

    // --- Distance milestones ---
    const milestone = Math.floor(p.distance / 500) * 500;
    if (milestone > 0 && milestone > this.lastMilestone) {
      this.lastMilestone = milestone;
      eff.floatingTexts.push({
        text: `${milestone}m!`,
        x: LANE_WIDTH * 2.5,
        y: PLAYER_Y - 120,
        alpha: 1,
        vy: -40,
        color: '#00ffff',
        size: 22,
      });
    }

    // --- Cleanup off-screen objects ---
    s.obstacles = s.obstacles.filter(o => o.active && o.y < CANVAS_HEIGHT + 100);
    s.collectibles = s.collectibles.filter(c => c.active && c.y < CANVAS_HEIGHT + 100);
    s.powerUps = s.powerUps.filter(pu => pu.active && pu.y < CANVAS_HEIGHT + 100);
    s.projectiles = s.projectiles.filter(proj => proj.active);

    // --- HUD callback ---
    const hudData: HUDData = {
      distance: p.distance,
      score: p.score,
      hp: p.hp,
      maxHp: p.maxHp,
      carrots: p.carrots,
      maxCarrots: p.maxCarrots,
      dashCooldown: p.dashCooldown,
      combo: s.combo.count,
      comboMultiplier: this.getComboMultiplier(),
      feverCharge: s.fever.charge,
      feverActive: s.fever.active,
      activeEffects: [...p.activeEffects],
      zoneName: ZONES[s.currentZone]?.label ?? '',
      kills: p.kills,
    };
    this.callbacks.onScoreUpdate(hudData);
  }

  // --- Obstacle Movement ---

  private updateObstacles(dt: number, scrollSpeed: number, playerLane: Lane) {
    const iceSlowFactor = this.hasEffect('ice') ? 0.5 : 1;

    for (const obs of this.state.obstacles) {
      if (!obs.active) continue;

      const config = OBSTACLE_CONFIGS.find(c => c.type === obs.type);
      if (!config) continue;

      obs.y += scrollSpeed * config.speed * dt * iceSlowFactor;

      switch (obs.type) {
        case 'crab': {
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
          obs.timer += dt * 3;
          obs.y += Math.sin(obs.timer) * 30 * dt;
          break;
        }
        case 'pufferfish': {
          obs.timer += dt;
          const cycle = obs.timer % 3;
          obs.state = cycle > 2 ? 1 : 0;
          break;
        }
        case 'squid': {
          obs.timer += dt;
          if (obs.timer >= 0.5) {
            obs.timer = 0;
            if (obs.lane < playerLane && obs.lane < LANE_COUNT - 1) {
              obs.lane = (obs.lane + 1) as Lane;
            } else if (obs.lane > playerLane && obs.lane > 0) {
              obs.lane = (obs.lane - 1) as Lane;
            }
          }
          break;
        }
        case 'shark': {
          if (!obs.warned && obs.y > 0) {
            obs.warned = true;
            obs.timer = 0;
            this.onSfx?.('sharkWarning');
          }
          if (obs.warned) {
            obs.timer += dt;
            if (obs.timer > 0.8 && obs.state === 0) {
              obs.state = 1;
            }
            if (obs.state === 1) {
              obs.y += scrollSpeed * 2 * dt * iceSlowFactor;
            }
          }
          break;
        }
      }
    }
  }

  // --- Power-Up Application ---

  private applyPowerUp(type: PowerUpType) {
    const p = this.state.player;
    const eff = this.state.effects;
    const s = this.state;

    const emojiMap: Record<PowerUpType, string> = {
      mushroom: '\uD83C\uDF44',  // mushroom
      bubble: '\uD83E\uDEE7',    // bubble
      lightning: '\u26A1',        // lightning
      vortex: '\uD83C\uDF00',    // vortex
      fire: '\uD83D\uDD25',      // fire
      ice: '\uD83E\uDDCA',       // ice
      diamond: '\uD83D\uDC8E',   // diamond
    };

    switch (type) {
      case 'mushroom':
        this.addEffect('mushroom', 5);
        break;

      case 'bubble':
        this.addEffect('bubble', 4);
        break;

      case 'lightning': {
        // Kill all on-screen enemies
        const killed: Obstacle[] = [];
        for (const obs of s.obstacles) {
          if (obs.active && obs.y > 0 && obs.y < CANVAS_HEIGHT) {
            obs.active = false;
            killed.push(obs);
          }
        }
        for (const obs of killed) {
          this.processKill(obs, false);
        }
        eff.redFlash = 0.3;
        // Lightning costs 1 HP
        p.hp -= 1;
        if (p.hp <= 0) {
          this.triggerGameOver();
          return;
        }
        break;
      }

      case 'vortex':
        this.addEffect('vortex', 3);
        p.invincibleTimer = Math.max(p.invincibleTimer, 3);
        break;

      case 'fire':
        this.addEffect('fire', 5);
        break;

      case 'ice':
        this.addEffect('ice', 4);
        break;

      case 'diamond':
        this.addEffect('diamond', 8);
        break;
    }

    this.onSfx?.('powerUp');

    // Floating text with powerup emoji
    const px = p.lane * LANE_WIDTH + LANE_WIDTH / 2;
    eff.floatingTexts.push({
      text: emojiMap[type] ?? type,
      x: px,
      y: PLAYER_Y - 40,
      alpha: 1,
      vy: -50,
      color: '#ffffff',
      size: 24,
    });
  }

  private addEffect(type: PowerUpType, duration: number) {
    const p = this.state.player;
    // Replace existing effect of same type or add new
    const existing = p.activeEffects.find(e => e.type === type);
    if (existing) {
      existing.remaining = duration;
      existing.duration = duration;
    } else {
      p.activeEffects.push({ type, remaining: duration, duration });
    }
  }

  // --- Game Over ---

  private triggerGameOver() {
    const s = this.state;
    s.effects.slowMotion = SLOWMO_DURATION;
    this.onSfx?.('gameOver');

    setTimeout(() => {
      s.gameOver = true;
      const savedData = addScore(s.player.score);
      s.highScore = savedData.highScore;
      const isNewRecord = s.player.score >= savedData.highScore;

      const data: GameOverData = {
        distance: s.player.distance,
        score: s.player.score,
        kills: s.player.kills,
        maxCombo: s.combo.maxCombo,
        zoneName: ZONES[s.currentZone]?.label ?? '',
        highScore: savedData.highScore,
        isNewRecord,
      };
      this.callbacks.onGameOver(data);
    }, SLOWMO_DURATION * 1000 + 300);
  }

  // --- Haptic Feedback ---

  private triggerHaptic(type: 'hit' | 'kill' | 'dash') {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    switch (type) {
      case 'kill':
        navigator.vibrate(5);
        break;
      case 'hit':
        navigator.vibrate([50, 30, 100]);
        break;
      case 'dash':
        navigator.vibrate(20);
        break;
    }
  }
}
