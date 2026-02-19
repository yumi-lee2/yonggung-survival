import { DifficultyConfig } from './types';

export function calculateScore(
  revealedCount: number,
  elapsedTime: number,
  config: DifficultyConfig,
  won: boolean
): number {
  const tileScore = revealedCount * 10;

  let speedBonus = 0;
  if (won) {
    const remainingTime = Math.max(0, config.timeLimit - elapsedTime);
    speedBonus = Math.floor(remainingTime * 5);
  }

  const total = (tileScore + speedBonus) * config.scoreMultiplier;
  return total;
}
