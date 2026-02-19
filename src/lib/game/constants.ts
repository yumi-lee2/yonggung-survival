import { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: '쉬움',
    description: '잔잔한 해변가',
    gridSize: 8,
    mineCount: 10,
    timeLimit: 300,
    scoreMultiplier: 1,
    emoji: '🏖️',
  },
  normal: {
    label: '보통',
    description: '깊은 바다 속',
    gridSize: 12,
    mineCount: 30,
    timeLimit: 600,
    scoreMultiplier: 2,
    emoji: '🌊',
  },
  hard: {
    label: '어려움',
    description: '용궁 심연',
    gridSize: 16,
    mineCount: 60,
    timeLimit: 900,
    scoreMultiplier: 3,
    emoji: '🐉',
  },
};

export const MINE_EMOJIS = ['🐙', '🦀', '🐍', '🐡', '🐉'];

export const FLAG_EMOJI = '🌿';

export const EXIT_EMOJI = '🌊';

export const RABBIT_EMOJI = '🐰';

export const NUMBER_COLORS: Record<number, string> = {
  1: '#4fc3f7',
  2: '#81c784',
  3: '#ffb74d',
  4: '#e57373',
  5: '#ba68c8',
  6: '#4dd0e1',
  7: '#f06292',
  8: '#ff8a65',
};

export const MINE_NAMES: Record<string, string> = {
  '🐙': '문어 장군',
  '🦀': '게 병사',
  '🐍': '뱀 첩자',
  '🐡': '복어 파수꾼',
  '🐉': '용 호위무사',
};
