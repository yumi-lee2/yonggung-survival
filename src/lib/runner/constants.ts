import { ObstacleType, PowerUpType, ZoneName, WavePhase, UpgradeId } from './types';

// === Canvas ===
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 700;
export const LANE_COUNT = 5;
export const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT; // 80px
export const PLAYER_Y = CANVAS_HEIGHT - 100;
export const OBJECT_SIZE = 40;

// === Scroll Speed ===
export const INITIAL_SPEED = 220;
export const MAX_SPEED = 550;
export const SPEED_RAMP_RATE = 3.0;

// === HP ===
export const MAX_HP = 3;
export const INVINCIBLE_DURATION = 0.6;
export const BLINK_RATE = 8;

// === Carrots (Projectiles) ===
export const START_CARROTS = 5;
export const MAX_CARROTS = 10;
export const CARROT_SPEED_MULTIPLIER = 3;
export const CARROT_REFILL_AMOUNT = 1;
export const CARROT_EMOJI = '🥕';

// === Kill Scores ===
export const KILL_SCORES: Record<ObstacleType, number> = {
  turtle: 10,
  crab: 20,
  jellyfish: 30,
  pufferfish: 50,
  squid: 80,
  shark: 150,
};

// === Obstacles ===
export interface ObstacleConfig {
  type: ObstacleType;
  emoji: string;
  minDistance: number;
  baseInterval: number;
  speed: number;
}

export const OBSTACLE_CONFIGS: ObstacleConfig[] = [
  { type: 'turtle', emoji: '🐢', minDistance: 0, baseInterval: 1.2, speed: 0.6 },
  { type: 'crab', emoji: '🦀', minDistance: 40, baseInterval: 1.2, speed: 1.0 },
  { type: 'jellyfish', emoji: '🪼', minDistance: 100, baseInterval: 1.5, speed: 0.7 },
  { type: 'pufferfish', emoji: '🐡', minDistance: 200, baseInterval: 2.0, speed: 0.8 },
  { type: 'squid', emoji: '🦑', minDistance: 400, baseInterval: 2.5, speed: 1.2 },
  { type: 'shark', emoji: '🦈', minDistance: 800, baseInterval: 3.5, speed: 1.5 },
];

// === Collectibles ===
export const SEAWEED_EMOJI = '🌿';

// === Combo ===
export const COMBO_TIMEOUT = 1.5;
export const COMBO_TIERS = [
  { threshold: 5, multiplier: 2, label: 'NICE!' },
  { threshold: 10, multiplier: 3, label: 'GREAT!' },
  { threshold: 20, multiplier: 5, label: 'AMAZING!' },
  { threshold: 50, multiplier: 10, label: 'LEGENDARY!' },
];

// === Fever ===
export const FEVER_CHARGE_PER_KILL = 5;
export const FEVER_CHARGE_PER_COMBO = 1;
export const FEVER_MAX_CHARGE = 100;
export const FEVER_DURATION = 5.0;
export const FEVER_SPEED_BOOST = 1.3;
export const FEVER_SCORE_MULTIPLIER = 5;

// === Power-Ups ===
export interface PowerUpConfig {
  type: PowerUpType;
  emoji: string;
  minDistance: number;
  duration: number;
  rarity: number;
}

export const POWERUP_CONFIGS: PowerUpConfig[] = [
  { type: 'mushroom', emoji: '🍄', minDistance: 150, duration: 5, rarity: 10 },
  { type: 'bubble', emoji: '🫧', minDistance: 250, duration: 4, rarity: 10 },
  { type: 'lightning', emoji: '⚡', minDistance: 400, duration: 0, rarity: 8 },
  { type: 'vortex', emoji: '🌀', minDistance: 600, duration: 3, rarity: 6 },
  { type: 'fire', emoji: '🔥', minDistance: 800, duration: 5, rarity: 6 },
  { type: 'ice', emoji: '🧊', minDistance: 1000, duration: 4, rarity: 7 },
  { type: 'diamond', emoji: '💎', minDistance: 1500, duration: 8, rarity: 2 },
];

// === Zones ===
export interface ZoneConfig {
  name: ZoneName;
  label: string;
  emoji: string;
  startDistance: number;
  bgColors: [string, string, string, string];
  obstacleWeights: Partial<Record<ObstacleType, number>>;
}

export const ZONES: ZoneConfig[] = [
  {
    name: 'palace',
    label: '용궁 출구',
    emoji: '🏯',
    startDistance: 0,
    bgColors: ['#1a3a6a', '#15305a', '#0f254a', '#0a1628'],
    obstacleWeights: { turtle: 5, crab: 5 },
  },
  {
    name: 'coral',
    label: '산호초 숲',
    emoji: '🪸',
    startDistance: 200,
    bgColors: ['#1a6a5a', '#156050', '#0f4a3a', '#0a2820'],
    obstacleWeights: { turtle: 2, crab: 8, jellyfish: 8 },
  },
  {
    name: 'abyss',
    label: '심해 해구',
    emoji: '🌊',
    startDistance: 500,
    bgColors: ['#2a1a5a', '#20154a', '#150f3a', '#0a0828'],
    obstacleWeights: { crab: 3, jellyfish: 5, pufferfish: 8, squid: 6 },
  },
  {
    name: 'shark',
    label: '상어 영역',
    emoji: '🦈',
    startDistance: 1000,
    bgColors: ['#5a1a1a', '#4a1515', '#3a0f0f', '#280a0a'],
    obstacleWeights: { pufferfish: 4, squid: 8, shark: 8 },
  },
  {
    name: 'surface',
    label: '수면 근처',
    emoji: '☀️',
    startDistance: 1800,
    bgColors: ['#5B9BD5', '#4a8ac5', '#3a7ab5', '#2a6a8a'],
    obstacleWeights: { turtle: 2, crab: 6, jellyfish: 6, pufferfish: 6, squid: 8, shark: 8 },
  },
];

// === Wave Patterns ===
export interface WavePhaseConfig {
  phase: WavePhase;
  duration: number;
  spawnMultiplier: number;
  speedMultiplier: number;
}

export const WAVE_PATTERN: WavePhaseConfig[] = [
  { phase: 'calm', duration: 2, spawnMultiplier: 0.9, speedMultiplier: 0.95 },
  { phase: 'rising', duration: 3, spawnMultiplier: 1.3, speedMultiplier: 1.1 },
  { phase: 'intense', duration: 4, spawnMultiplier: 2.5, speedMultiplier: 1.3 },
  { phase: 'rest', duration: 1, spawnMultiplier: 0.5, speedMultiplier: 0.9 },
];

// === Close Call ===
export const CLOSE_CALL_THRESHOLD = 15;
export const CLOSE_CALL_BONUS = 5;

// === Colors (fallback) ===
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

// === Particle Colors per Obstacle ===
export const OBSTACLE_PARTICLE_COLORS: Record<ObstacleType, string[]> = {
  turtle: ['#2d8a4e', '#4ade80', '#166534'],
  crab: ['#ef4444', '#f87171', '#dc2626'],
  jellyfish: ['#c084fc', '#a855f7', '#7c3aed'],
  pufferfish: ['#fbbf24', '#f59e0b', '#d97706'],
  squid: ['#6366f1', '#818cf8', '#4f46e5'],
  shark: ['#64748b', '#94a3b8', '#475569'],
};

// === Upgrades ===
export interface UpgradeConfig {
  id: UpgradeId;
  emoji: string;
  name: string;
  description: string;
  maxLevel: number;
  costs: number[];
  effect: (level: number) => string;
}

export const UPGRADE_CONFIGS: UpgradeConfig[] = [
  {
    id: 'hp', emoji: '❤️', name: '체력 강화', description: '최대 HP +1',
    maxLevel: 3, costs: [500, 1500, 4000],
    effect: (l) => `HP +${l}`,
  },
  {
    id: 'carrotPouch', emoji: '🥕', name: '당근 주머니', description: '시작 당근 +2',
    maxLevel: 3, costs: [300, 800, 2000],
    effect: (l) => `시작 당근 +${l * 2}`,
  },
  {
    id: 'pierce', emoji: '🎯', name: '관통 당근', description: '당근이 적 관통 확률',
    maxLevel: 2, costs: [1000, 3000],
    effect: (l) => `${l * 33}% 관통`,
  },
  {
    id: 'feverCharge', emoji: '🔥', name: '피버 충전', description: '피버 게이지 충전 +20%',
    maxLevel: 3, costs: [800, 2000, 5000],
    effect: (l) => `충전 +${l * 20}%`,
  },
  {
    id: 'startShield', emoji: '🛡️', name: '시작 보호막', description: '게임 시작 시 무적 3초',
    maxLevel: 1, costs: [2000],
    effect: () => '3초 무적',
  },
  {
    id: 'fastCarrot', emoji: '💨', name: '빠른 당근', description: '당근 속도 +25%',
    maxLevel: 2, costs: [600, 1500],
    effect: (l) => `속도 +${l * 25}%`,
  },
];

// === Zone Transition Reward ===
export const ZONE_REWARD_HP_RESTORE = 1;
export const ZONE_REWARD_CARROT_REFILL = 5;
export const ZONE_REWARD_POWERUP = true;

// === Carrot Drop (Sky) ===
export const CARROT_DROP_INTERVAL = 1.33;
