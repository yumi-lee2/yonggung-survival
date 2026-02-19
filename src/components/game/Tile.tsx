'use client';

import { memo, useCallback } from 'react';
import { Tile as TileType } from '@/lib/game/types';
import { MINE_EMOJIS, FLAG_EMOJI, EXIT_EMOJI, RABBIT_EMOJI, DANGER_EMOJIS } from '@/lib/game/constants';

interface TileProps {
  tile: TileType;
  isRabbit: boolean;
  isMovable: boolean;
  onClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
  revealDelay?: number;
  mineDelay?: number;
  gameOver: boolean;
}

function getRandomMineEmoji(row: number, col: number): string {
  const index = (row * 7 + col * 13) % MINE_EMOJIS.length;
  return MINE_EMOJIS[index];
}

function getDangerEmoji(level: number): string {
  return DANGER_EMOJIS[Math.min(level, DANGER_EMOJIS.length - 1)] || '';
}

function TileComponent({ tile, isRabbit, isMovable, onClick, onRightClick, revealDelay, mineDelay, gameOver }: TileProps) {
  const { row, col, isMine, isExit, adjacentMines, state } = tile;

  const handleClick = useCallback(() => {
    if (gameOver) return;
    onClick(row, col);
  }, [onClick, row, col, gameOver]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (gameOver) return;
      onRightClick(row, col);
    },
    [onRightClick, row, col, gameOver]
  );

  // Long press for mobile flag
  const longPressTimer = useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    return {
      onTouchStart: () => {
        timer = setTimeout(() => {
          if (!gameOver) onRightClick(row, col);
        }, 500);
      },
      onTouchEnd: () => clearTimeout(timer),
      onTouchMove: () => clearTimeout(timer),
    };
  }, [onRightClick, row, col, gameOver]);

  const touchHandlers = longPressTimer();

  let stateClass = 'tile-hidden';
  let content: React.ReactNode = null;
  let extraClass = '';

  if (state === 'flagged') {
    stateClass = 'tile-flagged';
    content = <span className="tile-emoji">{FLAG_EMOJI}</span>;
  } else if (state === 'revealed') {
    if (isMine) {
      stateClass = 'tile-mine';
      extraClass = mineDelay !== undefined ? 'tile-mine-animate' : '';
      content = <span className="tile-emoji">{getRandomMineEmoji(row, col)}</span>;
    } else if (isExit) {
      stateClass = 'tile-revealed tile-exit';
      content = <span className="tile-emoji">{EXIT_EMOJI}</span>;
    } else if (adjacentMines > 0) {
      stateClass = `tile-revealed tile-danger-${adjacentMines}`;
      content = <span className="tile-emoji">{getDangerEmoji(adjacentMines)}</span>;
    } else {
      stateClass = 'tile-revealed';
    }
    if (revealDelay !== undefined && !isMine) {
      extraClass = 'tile-reveal-wave';
    }
  }

  // Show adjacent mines hint on movable hidden tiles
  if (isMovable && state === 'hidden' && adjacentMines > 0) {
    const emoji = getDangerEmoji(adjacentMines);
    if (emoji) {
      content = <span className="tile-hint-emoji">{emoji}</span>;
    }
  }

  // Add rabbit class and movable class
  if (isRabbit) {
    extraClass += ' tile-rabbit';
  }
  if (isMovable && state === 'hidden') {
    extraClass += ' tile-movable';
  }

  // Rabbit overlay on the tile where rabbit stands
  const rabbitOverlay = isRabbit && !gameOver ? (
    <span className="tile-emoji tile-emoji-rabbit rabbit-hop" style={{ position: 'absolute', zIndex: 3 }}>
      {RABBIT_EMOJI}
    </span>
  ) : null;

  return (
    <div
      className={`tile ${stateClass} ${extraClass}`}
      style={{
        ...(revealDelay !== undefined && !isMine ? { '--reveal-delay': `${revealDelay}ms` } as React.CSSProperties : {}),
        ...(mineDelay !== undefined ? { '--mine-delay': `${mineDelay}ms` } as React.CSSProperties : {}),
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      {...touchHandlers}
      role="button"
      aria-label={
        isRabbit
          ? `타일 ${row + 1}, ${col + 1} - 토끼 위치`
          : state === 'hidden'
          ? `타일 ${row + 1}, ${col + 1} - 숨김${isMovable ? ' (이동 가능)' : ''}`
          : state === 'flagged'
          ? `타일 ${row + 1}, ${col + 1} - 깃발`
          : isMine
          ? `타일 ${row + 1}, ${col + 1} - 심복!`
          : `타일 ${row + 1}, ${col + 1} - ${adjacentMines > 0 ? `주변 ${adjacentMines}` : '안전'}`
      }
      tabIndex={0}
    >
      <div className="tile-top">
        {content}
        {rabbitOverlay}
      </div>
    </div>
  );
}

export default memo(TileComponent, (prev, next) => {
  return (
    prev.tile.state === next.tile.state &&
    prev.tile.isMine === next.tile.isMine &&
    prev.tile.adjacentMines === next.tile.adjacentMines &&
    prev.tile.isExit === next.tile.isExit &&
    prev.isRabbit === next.isRabbit &&
    prev.isMovable === next.isMovable &&
    prev.gameOver === next.gameOver &&
    prev.revealDelay === next.revealDelay &&
    prev.mineDelay === next.mineDelay
  );
});
