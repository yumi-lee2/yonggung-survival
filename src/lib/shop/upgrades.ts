import { SaveData } from '../runner/types';
import { MAX_HP, START_CARROTS, MAX_CARROTS, CARROT_SPEED_MULTIPLIER } from '../runner/constants';

export function getMaxHP(save: SaveData): number {
  return MAX_HP + (save.upgrades.hp || 0);
}

export function getStartCarrots(save: SaveData): number {
  return START_CARROTS + (save.upgrades.carrotPouch || 0) * 2;
}

export function getMaxCarrots(save: SaveData): number {
  return MAX_CARROTS + (save.upgrades.carrotPouch || 0) * 2;
}

export function getPierceChance(save: SaveData): number {
  return (save.upgrades.pierce || 0) * 0.33;
}

export function getFeverChargeBonus(save: SaveData): number {
  return 1 + (save.upgrades.feverCharge || 0) * 0.2;
}

export function getStartShieldDuration(save: SaveData): number {
  return (save.upgrades.startShield || 0) > 0 ? 3 : 0;
}

export function getCarrotSpeedMultiplier(save: SaveData): number {
  return CARROT_SPEED_MULTIPLIER * (1 + (save.upgrades.fastCarrot || 0) * 0.25);
}
