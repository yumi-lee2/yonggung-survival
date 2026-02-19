'use client';

import { useRef, useCallback, useState } from 'react';
import { GameEngine } from '@/lib/runner/GameEngine';
import { Renderer } from '@/lib/runner/Renderer';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { HUDData, GameOverData, ActiveEffect } from '@/lib/runner/types';

export interface HUDState {
  distance: number;
  score: number;
  hp: number;
  maxHp: number;
  carrots: number;
  maxCarrots: number;
  dashCooldown: number;
  combo: number;
  comboMultiplier: number;
  feverCharge: number;
  feverActive: boolean;
  activeEffects: ActiveEffect[];
  zoneName: string;
  kills: number;
}

export interface GameOverState {
  distance: number;
  score: number;
  kills: number;
  maxCombo: number;
  zoneName: string;
  highScore: number;
  isNewRecord: boolean;
}

export function useGameEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [hud, setHud] = useState<HUDState>({
    distance: 0,
    score: 0,
    hp: 3,
    maxHp: 3,
    carrots: 5,
    maxCarrots: 10,
    dashCooldown: 0,
    combo: 0,
    comboMultiplier: 1,
    feverCharge: 0,
    feverActive: false,
    activeEffects: [],
    zoneName: '용궁 출구',
    kills: 0,
  });
  const [gameOver, setGameOver] = useState<GameOverState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Init audio on first user interaction
    if (!audioRef.current) {
      audioRef.current = new AudioEngine();
    }
    audioRef.current.init();

    // Init engine
    if (!engineRef.current) {
      engineRef.current = new GameEngine({
        onGameOver: (data: GameOverData) => {
          setIsRunning(false);
          setGameOver({
            distance: data.distance,
            score: data.score,
            kills: data.kills,
            maxCombo: data.maxCombo,
            zoneName: data.zoneName,
            highScore: data.highScore,
            isNewRecord: data.isNewRecord,
          });
        },
        onScoreUpdate: (data: HUDData) => {
          setHud({
            distance: data.distance,
            score: data.score,
            hp: data.hp,
            maxHp: data.maxHp,
            carrots: data.carrots,
            maxCarrots: data.maxCarrots,
            dashCooldown: data.dashCooldown,
            combo: data.combo,
            comboMultiplier: data.comboMultiplier,
            feverCharge: data.feverCharge,
            feverActive: data.feverActive,
            activeEffects: data.activeEffects,
            zoneName: data.zoneName,
            kills: data.kills,
          });
        },
      });
    }

    // Init renderer
    if (!rendererRef.current) {
      rendererRef.current = new Renderer(canvas);
    }

    // Connect audio
    engineRef.current.onSfx = (name: string, data?: Record<string, number>) => {
      audioRef.current?.play(name, data);
    };

    // Reset & attach
    engineRef.current.reset();
    engineRef.current.attach(canvas);
    setGameOver(null);
    setIsRunning(true);
    setHud({
      distance: 0,
      score: 0,
      hp: 3,
      maxHp: 3,
      carrots: 5,
      maxCarrots: 10,
      dashCooldown: 0,
      combo: 0,
      comboMultiplier: 1,
      feverCharge: 0,
      feverActive: false,
      activeEffects: [],
      zoneName: '용궁 출구',
      kills: 0,
    });

    // Resize
    const resize = () => {
      if (rendererRef.current) {
        rendererRef.current.resize(
          Math.min(window.innerWidth - 32, 500),
          window.innerHeight - 160,
        );
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Game loop
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      engineRef.current?.update(dt);
      if (engineRef.current && rendererRef.current) {
        rendererRef.current.render(engineRef.current.state, dt);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);

  const stopGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    engineRef.current?.detach();
    setIsRunning(false);
  }, []);

  const restart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    engineRef.current?.detach();
    startGame();
  }, [startGame]);

  return { hud, gameOver, isRunning, startGame, stopGame, restart };
}
