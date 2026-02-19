import { Tile, DifficultyConfig } from './types';

export function createEmptyGrid(size: number): Tile[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      isMine: false,
      isExit: false,
      adjacentMines: 0,
      state: 'hidden' as const,
    }))
  );
}

function getNeighbors(row: number, col: number, size: number): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

export { getNeighbors };

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCenterPosition(gridSize: number): { row: number; col: number } {
  const center = Math.floor(gridSize / 2);
  return { row: center, col: center };
}

export function placeMines(
  grid: Tile[][],
  config: DifficultyConfig,
  rabbitRow: number,
  rabbitCol: number
): Tile[][] {
  const size = config.gridSize;
  const safeZone = new Set<string>();

  safeZone.add(`${rabbitRow},${rabbitCol}`);
  for (const [nr, nc] of getNeighbors(rabbitRow, rabbitCol, size)) {
    safeZone.add(`${nr},${nc}`);
  }

  const candidates: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!safeZone.has(`${r},${c}`)) {
        candidates.push([r, c]);
      }
    }
  }

  const shuffled = fisherYatesShuffle(candidates);
  const minePositions = shuffled.slice(0, config.mineCount);

  const newGrid = grid.map(row => row.map(tile => ({ ...tile })));

  for (const [r, c] of minePositions) {
    newGrid[r][c].isMine = true;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let count = 0;
      for (const [nr, nc] of getNeighbors(r, c, size)) {
        if (newGrid[nr][nc].isMine) count++;
      }
      newGrid[r][c].adjacentMines = count;
    }
  }

  placeExit(newGrid, size);

  return newGrid;
}

function placeExit(grid: Tile[][], size: number): void {
  const edgeTiles: [number, number][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r === 0 || r === size - 1 || c === 0 || c === size - 1) {
        if (!grid[r][c].isMine) {
          edgeTiles.push([r, c]);
        }
      }
    }
  }

  if (edgeTiles.length > 0) {
    const shuffled = fisherYatesShuffle(edgeTiles);
    const [er, ec] = shuffled[0];
    grid[er][ec].isExit = true;
  }
}

export function countMines(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.isMine) count++;
    }
  }
  return count;
}
