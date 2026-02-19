'use client';

import { useState, useEffect, useCallback } from 'react';
import { Difficulty, HighScore } from '@/lib/game/types';

const STORAGE_KEY = 'yonggung-high-scores';
const MAX_SCORES_PER_DIFFICULTY = 5;

function loadScores(): HighScore[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScores(scores: HighScore[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // localStorage full or unavailable
  }
}

export function useHighScores() {
  const [scores, setScores] = useState<HighScore[]>([]);

  useEffect(() => {
    setScores(loadScores());
  }, []);

  const addScore = useCallback((difficulty: Difficulty, score: number, time: number) => {
    const newScore: HighScore = {
      difficulty,
      score,
      time,
      date: new Date().toISOString(),
    };

    setScores(prev => {
      const updated = [...prev, newScore];
      const grouped = updated
        .filter(s => s.difficulty === difficulty)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SCORES_PER_DIFFICULTY);

      const others = updated.filter(s => s.difficulty !== difficulty);
      const all = [...others, ...grouped];
      saveScores(all);
      return all;
    });
  }, []);

  const getScoresForDifficulty = useCallback(
    (difficulty: Difficulty) =>
      scores
        .filter(s => s.difficulty === difficulty)
        .sort((a, b) => b.score - a.score),
    [scores]
  );

  const getTopScore = useCallback(
    (difficulty: Difficulty): number => {
      const filtered = scores.filter(s => s.difficulty === difficulty);
      if (filtered.length === 0) return 0;
      return Math.max(...filtered.map(s => s.score));
    },
    [scores]
  );

  return { scores, addScore, getScoresForDifficulty, getTopScore };
}
