import { Player, Obstacle, Collectible, PowerUp, Projectile, Lane } from './types';
import { LANE_WIDTH, PLAYER_Y, OBJECT_SIZE, CLOSE_CALL_THRESHOLD } from './constants';

function laneToX(lane: Lane | number): number {
  return lane * LANE_WIDTH + LANE_WIDTH / 2;
}

function boxOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}

export interface CollisionResult {
  hitObstacles: Obstacle[];
  collectedCarrots: Collectible[];
  collectedSeaweed: Collectible[];
  collectedPowerUps: PowerUp[];
  projectileHits: Array<{ projectile: Projectile; obstacle: Obstacle }>;
  closeCalls: Obstacle[];
  feverKills: Obstacle[];
}

export function checkCollisions(
  player: Player,
  obstacles: Obstacle[],
  collectibles: Collectible[],
  powerUps: PowerUp[],
  projectiles: Projectile[],
  hasMushroomEffect: boolean,
  hasBubbleEffect: boolean,
  feverActive: boolean,
): CollisionResult {
  const px = laneToX(player.lane);
  const py = PLAYER_Y;

  // Player hitbox varies by active effect
  let playerHitbox = OBJECT_SIZE * 0.7;
  if (hasMushroomEffect) {
    playerHitbox = OBJECT_SIZE * 1.4;
  } else if (hasBubbleEffect) {
    playerHitbox = OBJECT_SIZE * 0.35;
  }

  const result: CollisionResult = {
    hitObstacles: [],
    collectedCarrots: [],
    collectedSeaweed: [],
    collectedPowerUps: [],
    projectileHits: [],
    closeCalls: [],
    feverKills: [],
  };

  // --- Projectile vs Obstacle collisions ---
  for (const proj of projectiles) {
    if (!proj.active) continue;
    const projX = laneToX(proj.lane);
    const projHitbox = proj.big ? OBJECT_SIZE * 1.0 : OBJECT_SIZE * 0.5;

    for (const obs of obstacles) {
      if (!obs.active) continue;
      const ox = laneToX(obs.lane);
      const ow = obs.type === 'pufferfish' && obs.state > 0 ? OBJECT_SIZE * 2.5 : OBJECT_SIZE;

      if (boxOverlap(projX, proj.y, projHitbox, projHitbox, ox, obs.y, ow, OBJECT_SIZE)) {
        result.projectileHits.push({ projectile: proj, obstacle: obs });
        // Mark obstacle inactive immediately so it is not hit by multiple projectiles
        obs.active = false;
        break;
      }
    }
  }

  // --- Player vs Obstacle collisions ---
  for (const obs of obstacles) {
    if (!obs.active) continue;
    const ox = laneToX(obs.lane);
    const ow = obs.type === 'pufferfish' && obs.state > 0 ? OBJECT_SIZE * 2.5 : OBJECT_SIZE;

    if (boxOverlap(px, py, playerHitbox, playerHitbox, ox, obs.y, ow, OBJECT_SIZE)) {
      if (feverActive) {
        // During fever, touching enemies kills them instead of hurting the player
        result.feverKills.push(obs);
      } else {
        result.hitObstacles.push(obs);
      }
    } else {
      // Close call check (only for non-hit, non-fever-killed obstacles)
      const dist = Math.sqrt((px - ox) ** 2 + (py - obs.y) ** 2);
      if (dist < OBJECT_SIZE + CLOSE_CALL_THRESHOLD && Math.abs(py - obs.y) < OBJECT_SIZE) {
        result.closeCalls.push(obs);
      }
    }
  }

  // --- Player vs Collectible collisions ---
  for (const col of collectibles) {
    if (!col.active || col.collected) continue;
    const cx = laneToX(col.lane);
    const colSize = OBJECT_SIZE * 0.5;

    if (boxOverlap(px, py, playerHitbox, playerHitbox, cx, col.y, colSize, colSize)) {
      if (col.type === 'carrot') {
        result.collectedCarrots.push(col);
      } else {
        result.collectedSeaweed.push(col);
      }
    }
  }

  // --- Player vs PowerUp collisions ---
  for (const pu of powerUps) {
    if (!pu.active || pu.collected) continue;
    const pux = laneToX(pu.lane);
    const puSize = OBJECT_SIZE * 0.7;

    if (boxOverlap(px, py, playerHitbox, playerHitbox, pux, pu.y, puSize, puSize)) {
      result.collectedPowerUps.push(pu);
    }
  }

  return result;
}
