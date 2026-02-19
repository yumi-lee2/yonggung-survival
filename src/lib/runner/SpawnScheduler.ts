import { Lane, Obstacle, Collectible, PowerUp, GameState, WaveState } from './types';
import {
  OBSTACLE_CONFIGS,
  POWERUP_CONFIGS,
  LANE_COUNT,
  OBJECT_SIZE,
  CARROT_SPAWN_INTERVAL,
  SEAWEED_SPAWN_DISTANCE,
  POWERUP_SPAWN_INTERVAL,
  CANVAS_HEIGHT,
  ZONES,
  WAVE_PATTERN,
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
  private carrotTimer = 0;
  private lastSeaweedDistance = 0;
  private lastPowerUpDistance = 0;

  constructor() {
    this.obstacleTimers = OBSTACLE_CONFIGS.map(() => 0);
  }

  reset() {
    this.obstacleTimers = OBSTACLE_CONFIGS.map(() => 0);
    this.carrotTimer = 0;
    this.lastSeaweedDistance = 0;
    this.lastPowerUpDistance = 0;
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
    this.spawnCarrots(dt, state.collectibles, wave);
    this.spawnSeaweed(distance, state.collectibles);
    this.spawnPowerUps(distance, state.powerUps);
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
    const difficultyFactor = Math.max(0.4, 1 - distance / 10000);

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

  private spawnCarrots(dt: number, collectibles: Collectible[], wave: WaveState) {
    const waveConfig = WAVE_PATTERN[wave.phaseIndex] ?? WAVE_PATTERN[0];
    const phase = waveConfig.phase;

    // Adjust spawn rate based on wave phase
    let rateMultiplier = 1;
    if (phase === 'rest') {
      rateMultiplier = 2; // more carrots during rest
    } else if (phase === 'intense') {
      rateMultiplier = 0.5; // fewer carrots during intense
    }

    this.carrotTimer -= dt;
    if (this.carrotTimer <= 0) {
      this.carrotTimer = CARROT_SPAWN_INTERVAL * (0.7 + Math.random() * 0.6) / rateMultiplier;

      // During rest phase, spawn 2-3 carrots at once for bonus ammo
      const spawnCount = phase === 'rest' ? 2 + Math.floor(Math.random() * 2) : 1;

      // Sometimes spawn in lines
      const patternChance = Math.random();
      if (patternChance < 0.3 && spawnCount === 1) {
        // Line of 2-3 carrots in a lane
        const lane = randomLane();
        const count = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < count; j++) {
          collectibles.push({
            id: getId(),
            type: 'carrot',
            lane,
            y: -OBJECT_SIZE - j * 50,
            width: OBJECT_SIZE * 0.5,
            height: OBJECT_SIZE * 0.5,
            active: true,
            collected: false,
          });
        }
        this.carrotTimer += CARROT_SPAWN_INTERVAL * count * 0.5;
      } else {
        for (let k = 0; k < spawnCount; k++) {
          collectibles.push({
            id: getId(),
            type: 'carrot',
            lane: randomLane(),
            y: -OBJECT_SIZE - k * 40,
            width: OBJECT_SIZE * 0.5,
            height: OBJECT_SIZE * 0.5,
            active: true,
            collected: false,
          });
        }
      }
    }
  }

  private spawnSeaweed(distance: number, collectibles: Collectible[]) {
    if (distance - this.lastSeaweedDistance >= SEAWEED_SPAWN_DISTANCE) {
      this.lastSeaweedDistance = distance;
      collectibles.push({
        id: getId(),
        type: 'seaweed',
        lane: randomLane(),
        y: -OBJECT_SIZE,
        width: OBJECT_SIZE * 0.6,
        height: OBJECT_SIZE * 0.6,
        active: true,
        collected: false,
      });
    }
  }

  private spawnPowerUps(distance: number, powerUps: PowerUp[]) {
    if (distance - this.lastPowerUpDistance >= POWERUP_SPAWN_INTERVAL) {
      this.lastPowerUpDistance = distance;

      // Filter eligible power-ups based on distance
      const eligible = POWERUP_CONFIGS.filter(c => distance >= c.minDistance);
      if (eligible.length === 0) return;

      // Weighted random selection based on rarity
      const totalWeight = eligible.reduce((sum, c) => sum + c.rarity, 0);
      let roll = Math.random() * totalWeight;
      let selected = eligible[0];
      for (const config of eligible) {
        roll -= config.rarity;
        if (roll <= 0) {
          selected = config;
          break;
        }
      }

      powerUps.push({
        id: getId(),
        type: selected.type,
        lane: randomLane(),
        y: -OBJECT_SIZE,
        width: OBJECT_SIZE * 0.7,
        height: OBJECT_SIZE * 0.7,
        active: true,
        collected: false,
      });
    }
  }
}
