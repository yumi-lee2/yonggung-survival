'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { GameEngine } from '@/lib/runner/GameEngine';
import { Renderer } from '@/lib/runner/Renderer';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { ItemType } from '@/lib/runner/types';

export interface HUDState {
  distance: number;
  pearls: number;
  hp: number;
  maxHp: number;
  item: ItemType | null;
  dashCooldown: number;
  highScore: number;
}

export interface GameOverState {
  distance: number;
  pearls: number;
  highScore: number;
  isNew: boolean;
}

export function useGameEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [hud, setHud] = useState<HUDState>({
    distance: 0, pearls: 0, hp: 3, maxHp: 3, item: null, dashCooldown: 0, highScore: 0,
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
        onGameOver: (distance, pearls) => {
          setIsRunning(false);
          const engine = engineRef.current!;
          setGameOver({
            distance,
            pearls,
            highScore: engine.state.highScore,
            isNew: Math.floor(distance) >= engine.state.highScore && engine.state.highScore > 0,
          });
        },
        onScoreUpdate: (distance, pearls, hp, item, dashCooldown) => {
          setHud(prev => ({
            ...prev,
            distance,
            pearls,
            hp,
            item,
            dashCooldown,
          }));
        },
      });
    }

    // Init renderer
    if (!rendererRef.current) {
      rendererRef.current = new Renderer(canvas);
    }

    // Connect audio
    engineRef.current.onSfx = (name, data) => {
      audioRef.current?.play(name, data);
    };

    // Reset & attach
    engineRef.current.reset();
    engineRef.current.attach(canvas);
    setGameOver(null);
    setIsRunning(true);
    setHud({
      distance: 0, pearls: 0, hp: 3, maxHp: 3, item: null, dashCooldown: 0,
      highScore: engineRef.current.state.highScore,
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
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // cap at 50ms
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

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      engineRef.current?.detach();
      audioRef.current?.destroy();
    };
  }, []);

  return { hud, gameOver, isRunning, startGame, stopGame, restart };
}
