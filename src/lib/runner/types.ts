// === Core Types ===

export type Lane = 0 | 1 | 2 | 3 | 4;

export interface Position {
  lane: Lane;
  y: number;
}

export type ObstacleType = 'turtle' | 'crab' | 'jellyfish' | 'pufferfish' | 'squid' | 'shark';
export type CollectibleType = 'carrot' | 'seaweed';
export type PowerUpType = 'mushroom' | 'bubble' | 'lightning' | 'vortex' | 'fire' | 'ice' | 'diamond';

export interface GameObject {
  id: number;
  lane: Lane;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface Obstacle extends GameObject {
  type: ObstacleType;
  /** For crab: patrol direction. For squid: tracking target. For shark: charging state */
  state: number;
  /** For jellyfish: float phase. For pufferfish: expand timer */
  timer: number;
  /** For shark: warning shown */
  warned: boolean;
}

export interface Collectible extends GameObject {
  type: CollectibleType;
  collected: boolean;
}

export interface PowerUp extends GameObject {
  type: PowerUpType;
  collected: boolean;
}

export interface Projectile extends GameObject {
  speed: number;
  big: boolean;
  pierceLeft: number;
}

export interface ActiveEffect {
  type: PowerUpType;
  remaining: number;
  duration: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ComboState {
  count: number;
  timer: number;
  maxCombo: number;
}

export interface FeverState {
  charge: number;
  active: boolean;
  timer: number;
}

export type ZoneName = 'palace' | 'coral' | 'abyss' | 'shark' | 'surface';
export type WavePhase = 'calm' | 'rising' | 'intense' | 'rest';

export interface WaveState {
  phaseIndex: number;
  timer: number;
  cycle: number;
}

export interface Player {
  lane: Lane;
  y: number;
  hp: number;
  maxHp: number;
  invincibleTimer: number;
  dashCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  carrots: number;
  maxCarrots: number;
  activeEffects: ActiveEffect[];
  score: number;
  kills: number;
  distance: number;
}

export interface GameState {
  player: Player;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  powerUps: PowerUp[];
  projectiles: Projectile[];
  scrollSpeed: number;
  baseScrollSpeed: number;
  gameOver: boolean;
  isPaused: boolean;
  highScore: number;
  combo: ComboState;
  fever: FeverState;
  wave: WaveState;
  currentZone: number;
  zoneTransitionProgress: number;
  zoneLabelTimer: number;
  effects: Effects;
  dashBurstTimer: number;
}

export interface Effects {
  screenShake: number;
  redFlash: number;
  slowMotion: number;
  dashTrail: Array<{ lane: Lane; y: number; alpha: number }>;
  floatingTexts: Array<{
    text: string;
    x: number;
    y: number;
    alpha: number;
    vy: number;
    color: string;
    size?: number;
  }>;
  particles: Particle[];
}

export interface GameCallbacks {
  onGameOver: (data: GameOverData) => void;
  onScoreUpdate: (data: HUDData) => void;
}

export interface HUDData {
  distance: number;
  score: number;
  hp: number;
  maxHp: number;
  carrots: number;
  maxCarrots: number;
  dashCooldown: number;
  combo: number;
  comboMultiplier: number;
  feverCharge: number;
  feverActive: boolean;
  activeEffects: ActiveEffect[];
  zoneName: string;
  kills: number;
}

export interface GameOverData {
  distance: number;
  score: number;
  kills: number;
  maxCombo: number;
  zoneName: string;
  highScore: number;
  isNewRecord: boolean;
}

// === Save Data ===
export type UpgradeId = 'hp' | 'carrotPouch' | 'pierce' | 'feverCharge' | 'startShield' | 'fastCarrot';

export interface SaveData {
  totalScore: number;
  highScore: number;
  upgrades: Record<UpgradeId, number>;
}
