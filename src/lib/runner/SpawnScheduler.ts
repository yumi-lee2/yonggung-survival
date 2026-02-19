import { Lane, Obstacle, Collectible, Item } from './types';
import {
  OBSTACLE_CONFIGS,
  ITEM_CONFIGS,
  LANE_COUNT,
  OBJECT_SIZE,
  PEARL_SPAWN_INTERVAL,
  SEAWEED_SPAWN_DISTANCE,
  CANVAS_HEIGHT,
} from './constants';

let nextId = 1;
function getId(): number {
  return nextId++;
}

function randomLane(): Lane {
  return (Math.floor(Math.random() * LANE_COUNT)) as Lane;
}

export class SpawnScheduler {
  private obstacleTimers: number[];
  private pearlTimer = 0;
  private lastSeaweedDistance = 0;
  private lastItemDistance = 0;

  constructor() {
    this.obstacleTimers = OBSTACLE_CONFIGS.map(() => 0);
  }

  reset() {
    this.obstacleTimers = OBSTACLE_CONFIGS.map(() => 0);
    this.pearlTimer = 0;
    this.lastSeaweedDistance = 0;
    this.lastItemDistance = 0;
    nextId = 1;
  }

  update(
    dt: number,
    distance: number,
    playerLane: Lane,
    obstacles: Obstacle[],
    collectibles: Collectible[],
    items: Item[],
  ) {
    this.spawnObstacles(dt, distance, playerLane, obstacles);
    this.spawnPearls(dt, collectibles);
    this.spawnSeaweed(distance, collectibles);
    this.spawnItems(distance, items);
  }

  private spawnObstacles(dt: number, distance: number, playerLane: Lane, obstacles: Obstacle[]) {
    for (let i = 0; i < OBSTACLE_CONFIGS.length; i++) {
      const config = OBSTACLE_CONFIGS[i];
      if (distance < config.minDistance) continue;

      this.obstacleTimers[i] -= dt;
      if (this.obstacleTimers[i] <= 0) {
        // Reduce interval as distance increases (more intense over time)
        const difficultyFactor = Math.max(0.4, 1 - distance / 10000);
        this.obstacleTimers[i] = config.baseInterval * difficultyFactor * (0.8 + Math.random() * 0.4);

        let lane = randomLane();

        // Squid targets player lane with some randomness
        if (config.type === 'squid') {
          lane = Math.random() > 0.3 ? playerLane : randomLane();
        }

        // Shark: random lane but will charge
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

        // Crab starts with random direction
        if (config.type === 'crab') {
          obs.state = Math.random() > 0.5 ? 1 : -1;
        }

        obstacles.push(obs);
      }
    }
  }

  private spawnPearls(dt: number, collectibles: Collectible[]) {
    this.pearlTimer -= dt;
    if (this.pearlTimer <= 0) {
      this.pearlTimer = PEARL_SPAWN_INTERVAL * (0.7 + Math.random() * 0.6);

      // Sometimes spawn in patterns (lines)
      const patternChance = Math.random();
      if (patternChance < 0.3) {
        // Line of 3-5 pearls in a lane
        const lane = randomLane();
        const count = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < count; j++) {
          collectibles.push({
            id: getId(),
            type: 'pearl',
            lane,
            y: -OBJECT_SIZE - j * 50,
            width: OBJECT_SIZE * 0.5,
            height: OBJECT_SIZE * 0.5,
            active: true,
            collected: false,
          });
        }
        this.pearlTimer += PEARL_SPAWN_INTERVAL * count * 0.5;
      } else {
        collectibles.push({
          id: getId(),
          type: 'pearl',
          lane: randomLane(),
          y: -OBJECT_SIZE,
          width: OBJECT_SIZE * 0.5,
          height: OBJECT_SIZE * 0.5,
          active: true,
          collected: false,
        });
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

  private spawnItems(distance: number, items: Item[]) {
    if (distance - this.lastItemDistance >= 600 + Math.random() * 400) {
      this.lastItemDistance = distance;
      const eligible = ITEM_CONFIGS.filter(c => distance >= c.minDistance);
      if (eligible.length === 0) return;
      const config = eligible[Math.floor(Math.random() * eligible.length)];
      items.push({
        id: getId(),
        type: config.type,
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
