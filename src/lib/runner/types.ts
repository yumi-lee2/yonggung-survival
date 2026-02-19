// === Core Types ===

export type Lane = 0 | 1 | 2 | 3 | 4;

export interface Position {
  lane: Lane;
  y: number;
}

export type ObstacleType = 'turtle' | 'crab' | 'jellyfish' | 'pufferfish' | 'squid' | 'shark';
export type ItemType = 'shield' | 'lightning' | 'magnet';
export type CollectibleType = 'pearl' | 'seaweed';

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

export interface Item extends GameObject {
  type: ItemType;
  collected: boolean;
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
  heldItem: ItemType | null;
  shieldActive: boolean;
  magnetTimer: number;
  score: number;
  pearls: number;
  distance: number;
}

export interface GameState {
  player: Player;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  items: Item[];
  scrollSpeed: number;
  gameOver: boolean;
  isPaused: boolean;
  highScore: number;
  /** Visual effects state */
  effects: Effects;
}

export interface Effects {
  screenShake: number;
  redFlash: number;
  slowMotion: number;
  dashTrail: Array<{ lane: Lane; y: number; alpha: number }>;
  floatingTexts: Array<{ text: string; x: number; y: number; alpha: number; vy: number; color: string }>;
}

export interface GameCallbacks {
  onGameOver: (distance: number, pearls: number) => void;
  onScoreUpdate: (distance: number, pearls: number, hp: number, item: ItemType | null, dashCooldown: number) => void;
}
