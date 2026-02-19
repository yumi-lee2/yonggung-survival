import { ObstacleType, ItemType } from './types';

// === Canvas ===
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 700;
export const LANE_COUNT = 5;
export const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT; // 80px
export const PLAYER_Y = CANVAS_HEIGHT - 100;
export const OBJECT_SIZE = 40;

// === Movement ===
export const DASH_DURATION = 0.3; // seconds
export const DASH_COOLDOWN = 2.0;
export const DASH_DISTANCE = 40; // px forward

// === Scroll Speed ===
export const INITIAL_SPEED = 120; // px/s
export const MAX_SPEED = 350;
export const SPEED_RAMP_RATE = 0.5; // px/s per second

// === HP ===
export const MAX_HP = 3;
export const INVINCIBLE_DURATION = 1.5; // seconds
export const BLINK_RATE = 8; // Hz

// === Obstacles ===
export interface ObstacleConfig {
  type: ObstacleType;
  emoji: string;
  minDistance: number;
  baseInterval: number; // seconds between spawns
  speed: number; // relative to scroll (1 = same as scroll)
}

export const OBSTACLE_CONFIGS: ObstacleConfig[] = [
  { type: 'turtle', emoji: '🐢', minDistance: 0, baseInterval: 1.5, speed: 1.0 },
  { type: 'crab', emoji: '🦀', minDistance: 200, baseInterval: 2.5, speed: 1.0 },
  { type: 'jellyfish', emoji: '🪼', minDistance: 500, baseInterval: 3.0, speed: 0.7 },
  { type: 'pufferfish', emoji: '🐡', minDistance: 1000, baseInterval: 4.0, speed: 0.8 },
  { type: 'squid', emoji: '🦑', minDistance: 2000, baseInterval: 5.0, speed: 1.2 },
  { type: 'shark', emoji: '🦈', minDistance: 3000, baseInterval: 6.0, speed: 1.5 },
];

// === Items ===
export interface ItemConfig {
  type: ItemType;
  emoji: string;
  minDistance: number;
}

export const ITEM_CONFIGS: ItemConfig[] = [
  { type: 'shield', emoji: '🛡️', minDistance: 300 },
  { type: 'lightning', emoji: '⚡', minDistance: 500 },
  { type: 'magnet', emoji: '🧲', minDistance: 800 },
];

// === Collectibles ===
export const PEARL_EMOJI = '🔮';
export const SEAWEED_EMOJI = '🌿';
export const PEARL_SPAWN_INTERVAL = 0.4; // seconds
export const SEAWEED_SPAWN_DISTANCE = 800; // meters between seaweed

// === Magnet ===
export const MAGNET_DURATION = 5.0;
export const MAGNET_RANGE = 2; // lanes

// === Close Call ===
export const CLOSE_CALL_THRESHOLD = 15; // px
export const CLOSE_CALL_BONUS = 5;

// === Colors ===
export const BG_COLORS = {
  sky: '#87CEEB',
  shallow: '#5B9BD5',
  mid: '#2a6a8a',
  deep: '#1a3a5a',
  abyss: '#0a1628',
};

// === Game Over ===
export const SLOWMO_DURATION = 0.5;
export const SLOWMO_FACTOR = 0.3;
