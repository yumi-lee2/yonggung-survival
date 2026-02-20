import { Lane, Obstacle, Collectible, PowerUp, GameState, WaveState } from './types';
import {
  OBSTACLE_CONFIGS,
  LANE_COUNT,
  OBJECT_SIZE,
  CANVAS_HEIGHT,
  ZONES,
  WAVE_PATTERN,
  CARROT_DROP_INTERVAL,
} from './constants';

let nextId = 1;
function getId(): number {
  return nextId++;
}

function randomLane(): Lane {
  return Math.floor(Math.random() * LANE_COUNT) as Lane;
}

export class SpawnScheduler {
  private obstacleTimers: number[];
  private carrotTimer: number;

  constructor() {
    this.obstacleTimers = OBSTACLE_CONFIGS.map(() => 0);
    this.carrotTimer = CARROT_DROP_INTERVAL;
  }

  reset() {
    this.obstacleTimers = OBSTACLE_CONFIGS.map(() => 0);
    this.carrotTimer = CARROT_DROP_INTERVAL;
    nextId = 1;
  }

  update(
    dt: number,
    distance: number,
    playerLane: Lane,
    state: GameState,
    wave: WaveState,
    currentZone: number,
  ) {
    this.spawnObstacles(dt, distance, playerLane, state.obstacles, wave, currentZone);
    this.spawnCarrots(dt, state);
  }

  private spawnCarrots(dt: number, state: GameState) {
    this.carrotTimer -= dt;
    if (this.carrotTimer <= 0) {
      this.carrotTimer = CARROT_DROP_INTERVAL;
      state.collectibles.push({
        id: getId(),
        type: 'carrot',
        lane: randomLane(),
        y: -OBJECT_SIZE,
        width: OBJECT_SIZE * 0.5,
        height: OBJECT_SIZE * 0.5,
        active: true,
        collected: false,
      });
    }
  }

  private spawnObstacles(
    dt: number,
    distance: number,
    playerLane: Lane,
    obstacles: Obstacle[],
    wave: WaveState,
    currentZone: number,
  ) {
    const zone = ZONES[currentZone] ?? ZONES[0];
    const waveConfig = WAVE_PATTERN[wave.phaseIndex] ?? WAVE_PATTERN[0];
    const waveSpawnMult = waveConfig.spawnMultiplier;
    const difficultyFactor = Math.max(0.2, 1 - distance / 5000);

    for (let i = 0; i < OBSTACLE_CONFIGS.length; i++) {
      const config = OBSTACLE_CONFIGS[i];
      if (distance < config.minDistance) continue;

      // Check zone weight for this obstacle type
      const weight = zone.obstacleWeights[config.type] ?? 0;
      if (weight === 0) continue;

      this.obstacleTimers[i] -= dt;
      if (this.obstacleTimers[i] <= 0) {
        // Interval scaled by difficulty, randomness, wave multiplier, and zone weight
        const weightFactor = 10 / weight; // higher weight = shorter interval
        this.obstacleTimers[i] =
          config.baseInterval *
          difficultyFactor *
          (0.8 + Math.random() * 0.4) *
          weightFactor /
          waveSpawnMult;

        let lane = randomLane();

        // Squid targets player lane with some randomness
        if (config.type === 'squid') {
          lane = Math.random() > 0.3 ? playerLane : randomLane();
        }

        const obs: Obstacle = {
          id: getId(),
          type: config.type,
          lane,
          y: -OBJECT_SIZE,
          width: OBJECT_SIZE,
          height: OBJECT_SIZE,
          active: true,
          state: 0,
          timer: 0,
          warned: false,
        };

        // Crab starts with random patrol direction
        if (config.type === 'crab') {
          obs.state = Math.random() > 0.5 ? 1 : -1;
        }

        obstacles.push(obs);
      }
    }
  }
}
