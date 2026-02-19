import { SaveData, UpgradeId } from '../runner/types';

const SAVE_KEY = 'yonggung-save';

const DEFAULT_SAVE: SaveData = {
  totalScore: 0,
  highScore: 0,
  upgrades: {
    hp: 0,
    carrotPouch: 0,
    pierce: 0,
    feverCharge: 0,
    startShield: 0,
    fastCarrot: 0,
  },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, upgrades: { ...DEFAULT_SAVE.upgrades } };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      totalScore: parsed.totalScore ?? 0,
      highScore: parsed.highScore ?? 0,
      upgrades: { ...DEFAULT_SAVE.upgrades, ...parsed.upgrades },
    };
  } catch {
    return { ...DEFAULT_SAVE, upgrades: { ...DEFAULT_SAVE.upgrades } };
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* noop */ }
}

export function addScore(runScore: number): SaveData {
  const data = loadSave();
  data.totalScore += runScore;
  if (runScore > data.highScore) data.highScore = runScore;
  saveSave(data);
  return data;
}

export function purchaseUpgrade(id: UpgradeId, cost: number): boolean {
  const data = loadSave();
  if (data.totalScore < cost) return false;
  data.totalScore -= cost;
  data.upgrades[id] = (data.upgrades[id] || 0) + 1;
  saveSave(data);
  return true;
}
