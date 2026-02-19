'use client';

import { useMemo } from 'react';
import { Tile as TileType, GameStatus } from '@/lib/game/types';
import { isAdjacent } from '@/lib/game/solver';
import TileComponent from './Tile';

interface BoardProps {
  grid: TileType[][];
  gridSize: number;
  status: GameStatus;
  rabbitPosition: { row: number; col: number };
  onTileClick: (row: number, col: number) => void;
  onTileRightClick: (row: number, col: number) => void;
}

export default function Board({ grid, gridSize, status, rabbitPosition, onTileClick, onTileRightClick }: BoardProps) {
  const gameOver = status === 'won' || status === 'lost';

  const tiles = useMemo(() => {
    const elements: React.ReactNode[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const tile = grid[r][c];
        const isRabbit = r === rabbitPosition.row && c === rabbitPosition.col;
        const isMovable = !gameOver && isAdjacent(rabbitPosition.row, rabbitPosition.col, r, c, gridSize) && tile.state === 'hidden';
        // Stagger delays for wave animation
        const revealDelay =
          tile.state === 'revealed' && !tile.isMine
            ? (r + c) * 30
            : undefined;
        const mineDelay =
          tile.state === 'revealed' && tile.isMine && gameOver
            ? Math.random() * 500
            : undefined;

        elements.push(
          <TileComponent
            key={`${r}-${c}`}
            tile={tile}
            isRabbit={isRabbit}
            isMovable={isMovable}
            onClick={onTileClick}
            onRightClick={onTileRightClick}
            revealDelay={revealDelay}
            mineDelay={mineDelay}
            gameOver={gameOver}
          />
        );
      }
    }
    return elements;
  }, [grid, gameOver, rabbitPosition, gridSize, onTileClick, onTileRightClick]);

  return (
    <div className="board-perspective">
      <div
        className={`board-isometric board-${gridSize} ${gameOver ? 'game-over' : ''}`}
        role="grid"
        aria-label="게임 보드"
      >
        {tiles}
      </div>
    </div>
  );
}
