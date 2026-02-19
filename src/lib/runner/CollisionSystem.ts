import { Player, Obstacle, Collectible, Item, Lane } from './types';
import { LANE_WIDTH, PLAYER_Y, OBJECT_SIZE, CLOSE_CALL_THRESHOLD } from './constants';

function laneToX(lane: Lane): number {
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
  collectedPearls: Collectible[];
  collectedSeaweed: Collectible[];
  collectedItems: Item[];
  closeCalls: Obstacle[];
}

export function checkCollisions(
  player: Player,
  obstacles: Obstacle[],
  collectibles: Collectible[],
  items: Item[],
): CollisionResult {
  const px = laneToX(player.lane);
  const py = PLAYER_Y;
  const ps = OBJECT_SIZE * 0.7; // player hitbox slightly smaller

  const result: CollisionResult = {
    hitObstacles: [],
    collectedPearls: [],
    collectedSeaweed: [],
    collectedItems: [],
    closeCalls: [],
  };

  // Check obstacles
  for (const obs of obstacles) {
    if (!obs.active) continue;
    const ox = laneToX(obs.lane);
    const ow = obs.type === 'pufferfish' && obs.state > 0 ? OBJECT_SIZE * 2.5 : OBJECT_SIZE;

    if (boxOverlap(px, py, ps, ps, ox, obs.y, ow, OBJECT_SIZE)) {
      result.hitObstacles.push(obs);
    } else {
      // Close call check
      const dist = Math.sqrt((px - ox) ** 2 + (py - obs.y) ** 2);
      if (dist < OBJECT_SIZE + CLOSE_CALL_THRESHOLD && Math.abs(py - obs.y) < OBJECT_SIZE) {
        result.closeCalls.push(obs);
      }
    }
  }

  // Check collectibles
  const magnetRange = player.magnetTimer > 0 ? LANE_WIDTH * 2.5 : 0;
  for (const col of collectibles) {
    if (!col.active || col.collected) continue;
    const cx = laneToX(col.lane);
    const collectSize = magnetRange > 0 ? magnetRange : ps;
    if (boxOverlap(px, py, collectSize, collectSize, cx, col.y, OBJECT_SIZE * 0.6, OBJECT_SIZE * 0.6)) {
      if (col.type === 'pearl') {
        result.collectedPearls.push(col);
      } else {
        result.collectedSeaweed.push(col);
      }
    }
  }

  // Check items
  for (const item of items) {
    if (!item.active || item.collected) continue;
    const ix = laneToX(item.lane);
    if (boxOverlap(px, py, ps, ps, ix, item.y, OBJECT_SIZE * 0.8, OBJECT_SIZE * 0.8)) {
      result.collectedItems.push(item);
    }
  }

  return result;
}
