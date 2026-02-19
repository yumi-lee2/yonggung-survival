import { Tile } from './types';

export function revealTile(grid: Tile[][], row: number, col: number): Tile[][] {
  const tile = grid[row][col];

  if (tile.state !== 'hidden') return grid;

  const newGrid = grid.map(r => r.map(t => ({ ...t })));
  newGrid[row][col] = { ...tile, state: 'revealed' };
  return newGrid;
}

export function isAdjacent(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  gridSize: number
): boolean {
  if (toRow < 0 || toRow >= gridSize || toCol < 0 || toCol >= gridSize) return false;
  const dr = Math.abs(fromRow - toRow);
  const dc = Math.abs(fromCol - toCol);
  if (dr === 0 && dc === 0) return false;
  return dr <= 1 && dc <= 1;
}

export function revealAllMines(grid: Tile[][]): Tile[][] {
  return grid.map(row =>
    row.map(tile =>
      tile.isMine ? { ...tile, state: 'revealed' as const } : tile
    )
  );
}

export function countRevealed(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.state === 'revealed' && !tile.isMine) count++;
    }
  }
  return count;
}

export function countFlags(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.state === 'flagged') count++;
    }
  }
  return count;
}
