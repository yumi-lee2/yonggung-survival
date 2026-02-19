export type Difficulty = 'easy' | 'normal' | 'hard';

export type TileState = 'hidden' | 'revealed' | 'flagged';

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface Tile {
  row: number;
  col: number;
  isMine: boolean;
  isExit: boolean;
  adjacentMines: number;
  state: TileState;
}

export interface DifficultyConfig {
  label: string;
  description: string;
  gridSize: number;
  mineCount: number;
  timeLimit: number;
  scoreMultiplier: number;
  emoji: string;
}

export interface GameState {
  status: GameStatus;
  grid: Tile[][];
  difficulty: Difficulty;
  config: DifficultyConfig;
  minesPlaced: boolean;
  flagCount: number;
  revealedCount: number;
  totalSafeTiles: number;
  elapsedTime: number;
  score: number;
  rabbitPosition: { row: number; col: number };
}

export type GameAction =
  | { type: 'INIT_GAME'; difficulty: Difficulty }
  | { type: 'MOVE_RABBIT'; row: number; col: number }
  | { type: 'TOGGLE_FLAG'; row: number; col: number }
  | { type: 'TICK_TIMER' }
  | { type: 'GAME_OVER'; won: boolean };

export interface HighScore {
  difficulty: Difficulty;
  score: number;
  time: number;
  date: string;
}
