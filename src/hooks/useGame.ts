'use client';

import { useReducer, useCallback } from 'react';
import { GameState, GameAction, Difficulty } from '@/lib/game/types';
import { DIFFICULTY_CONFIG } from '@/lib/game/constants';
import { createEmptyGrid, placeMines, getCenterPosition } from '@/lib/game/grid';
import { revealTile, isAdjacent, revealAllMines, countRevealed, countFlags } from '@/lib/game/solver';
import { calculateScore } from '@/lib/game/scoring';

function createInitialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIG[difficulty];
  const grid = createEmptyGrid(config.gridSize);
  const totalSafeTiles = config.gridSize * config.gridSize - config.mineCount;
  const rabbitPosition = getCenterPosition(config.gridSize);

  // Place mines at init so danger hints show at starting position
  const minedGrid = placeMines(grid, config, rabbitPosition.row, rabbitPosition.col);
  minedGrid[rabbitPosition.row][rabbitPosition.col].state = 'revealed';

  return {
    status: 'idle',
    grid: minedGrid,
    difficulty,
    config,
    minesPlaced: true,
    flagCount: 0,
    revealedCount: 1,
    totalSafeTiles,
    elapsedTime: 0,
    score: 0,
    rabbitPosition,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      return createInitialState(action.difficulty);
    }

    case 'MOVE_RABBIT': {
      const { row, col } = action;
      const { rabbitPosition, config } = state;

      // Only allow moves when idle (pre-first-move) or playing
      if (state.status !== 'idle' && state.status !== 'playing') return state;

      // Validate adjacency
      if (!isAdjacent(rabbitPosition.row, rabbitPosition.col, row, col, config.gridSize)) {
        return state;
      }

      // Target tile must be hidden (not flagged, not already revealed)
      const targetTile = state.grid[row][col];
      if (targetTile.state !== 'hidden') return state;

      let grid = state.grid;
      let status = state.status;

      // First move: start the game (mines already placed at init)
      if (state.status === 'idle') {
        status = 'playing';
      }

      // Reveal the target tile
      const tile = grid[row][col];

      // Stepped on a mine
      if (tile.isMine) {
        const revealedGrid = revealAllMines(grid);
        revealedGrid[row][col] = { ...revealedGrid[row][col], state: 'revealed' };
        const score = calculateScore(state.revealedCount, state.elapsedTime, config, false);
        return {
          ...state,
          grid: revealedGrid,
          status: 'lost',
          score,
        };
      }

      // Reveal the single tile
      const newGrid = revealTile(grid, row, col);
      const revealed = countRevealed(newGrid);

      // Reached the exit
      if (tile.isExit) {
        const score = calculateScore(revealed, state.elapsedTime, config, true);
        return {
          ...state,
          grid: newGrid,
          status: 'won',
          revealedCount: revealed,
          rabbitPosition: { row, col },
          score,
        };
      }

      // Normal move
      return {
        ...state,
        grid: newGrid,
        status,
        revealedCount: revealed,
        rabbitPosition: { row, col },
      };
    }

    case 'TOGGLE_FLAG': {
      if (state.status !== 'playing' && state.status !== 'idle') return state;

      const tile = state.grid[action.row][action.col];
      if (tile.state === 'revealed') return state;

      const newGrid = state.grid.map(row => row.map(t => ({ ...t })));
      const newState = tile.state === 'flagged' ? 'hidden' : 'flagged';
      newGrid[action.row][action.col] = { ...tile, state: newState as 'hidden' | 'flagged' };

      return {
        ...state,
        grid: newGrid,
        flagCount: countFlags(newGrid),
      };
    }

    case 'TICK_TIMER': {
      if (state.status !== 'playing') return state;

      const newTime = state.elapsedTime + 1;
      if (newTime >= state.config.timeLimit) {
        const revealedGrid = revealAllMines(state.grid);
        const score = calculateScore(state.revealedCount, newTime, state.config, false);
        return {
          ...state,
          grid: revealedGrid,
          status: 'lost',
          elapsedTime: newTime,
          score,
        };
      }

      return {
        ...state,
        elapsedTime: newTime,
      };
    }

    case 'GAME_OVER': {
      const score = calculateScore(
        state.revealedCount,
        state.elapsedTime,
        state.config,
        action.won
      );
      return {
        ...state,
        status: action.won ? 'won' : 'lost',
        score,
      };
    }

    default:
      return state;
  }
}

export function useGame(initialDifficulty: Difficulty = 'easy') {
  const [state, dispatch] = useReducer(gameReducer, initialDifficulty, createInitialState);

  const initGame = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'INIT_GAME', difficulty });
  }, []);

  const handleTileClick = useCallback((row: number, col: number) => {
    dispatch({ type: 'MOVE_RABBIT', row, col });
  }, []);

  const handleTileRightClick = useCallback((row: number, col: number) => {
    dispatch({ type: 'TOGGLE_FLAG', row, col });
  }, []);

  const tick = useCallback(() => {
    dispatch({ type: 'TICK_TIMER' });
  }, []);

  return {
    state,
    initGame,
    handleTileClick,
    handleTileRightClick,
    tick,
  };
}
