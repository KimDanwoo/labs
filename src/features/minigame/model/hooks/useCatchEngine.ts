'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameActions, useMinigameStatus } from '@entities/game/model/hooks';
import {
  MINIGAME_CATCH_EFFECT_MS,
  MINIGAME_CATCHER_BOTTOM,
  MINIGAME_CATCHER_HEIGHT,
  MINIGAME_CATCHER_SPEED,
  MINIGAME_CATCHER_WIDTH,
  MINIGAME_DURATION,
  MINIGAME_EMOJIS,
  MINIGAME_FIELD_HEIGHT,
  MINIGAME_FIELD_WIDTH,
  MINIGAME_ITEM_DESPAWN_MARGIN,
  MINIGAME_ITEM_SIZE,
  MINIGAME_ITEM_SPEED_ACCEL,
  MINIGAME_ITEM_SPEED_BASE,
  MINIGAME_ITEM_SPEED_RANDOM,
  MINIGAME_PHASE,
  MINIGAME_SPAWN_INTERVAL_BASE,
  MINIGAME_SPAWN_INTERVAL_MIN,
  MINIGAME_SPAWN_SPEEDUP,
} from '../constants';
import type { FallingItem, MinigamePhase } from '../types';

const CATCHER_START_X = MINIGAME_FIELD_WIDTH / 2 - MINIGAME_CATCHER_WIDTH / 2;
const CATCHER_Y = MINIGAME_FIELD_HEIGHT - (MINIGAME_CATCHER_BOTTOM + MINIGAME_CATCHER_HEIGHT);

type CatchTouchDirection = 'left' | 'right';

export function useCatchEngine() {
  const { minigameReward, markMinigamePlayed, closeModal } = useGameActions();
  const minigame = useMinigameStatus();

  const [phase, setPhase] = useState<MinigamePhase>(MINIGAME_PHASE.READY);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION);
  const [catcherX, setCatcherX] = useState(CATCHER_START_X);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [catchEffect, setCatchEffect] = useState<{ x: number; y: number } | null>(
    null,
  );

  const nextId = useRef(0);
  const gameStart = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const catcherRef = useRef(CATCHER_START_X);
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const lastSpawn = useRef(0);

  const startGame = useCallback(() => {
    if (!minigame.canPlay) return;
    markMinigamePlayed();
    setPhase(MINIGAME_PHASE.PLAYING);
    setScore(0);
    scoreRef.current = 0;
    setItems([]);
    itemsRef.current = [];
    setTimeLeft(MINIGAME_DURATION);
    setCatcherX(CATCHER_START_X);
    catcherRef.current = CATCHER_START_X;
    gameStart.current = Date.now();
    nextId.current = 0;
    lastSpawn.current = 0;
  }, [markMinigamePlayed, minigame.canPlay]);

  useEffect(() => {
    if (phase !== MINIGAME_PHASE.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    const pressed = keysPressed.current;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      pressed.clear();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== MINIGAME_PHASE.PLAYING) return;

    const loop = () => {
      const now = Date.now();
      const elapsed = now - gameStart.current;

      if (elapsed >= MINIGAME_DURATION) {
        setPhase(MINIGAME_PHASE.RESULT);
        setTimeLeft(0);
        setScore(scoreRef.current);
        return;
      }

      setTimeLeft(MINIGAME_DURATION - elapsed);

      if (keysPressed.current.has('ArrowLeft')) {
        catcherRef.current = Math.max(0, catcherRef.current - MINIGAME_CATCHER_SPEED);
      }
      if (keysPressed.current.has('ArrowRight')) {
        catcherRef.current = Math.min(
          MINIGAME_FIELD_WIDTH - MINIGAME_CATCHER_WIDTH,
          catcherRef.current + MINIGAME_CATCHER_SPEED,
        );
      }
      setCatcherX(catcherRef.current);

      const spawnInterval = Math.max(
        MINIGAME_SPAWN_INTERVAL_MIN,
        MINIGAME_SPAWN_INTERVAL_BASE - elapsed * MINIGAME_SPAWN_SPEEDUP,
      );
      if (now - lastSpawn.current > spawnInterval) {
        const newItem: FallingItem = {
          id: nextId.current++,
          x: Math.random() * (MINIGAME_FIELD_WIDTH - MINIGAME_ITEM_SIZE),
          y: -MINIGAME_ITEM_SIZE,
          emoji: MINIGAME_EMOJIS[Math.floor(Math.random() * MINIGAME_EMOJIS.length)],
          speed:
            MINIGAME_ITEM_SPEED_BASE +
            Math.random() * MINIGAME_ITEM_SPEED_RANDOM +
            elapsed * MINIGAME_ITEM_SPEED_ACCEL,
        };
        itemsRef.current = [...itemsRef.current, newItem];
        lastSpawn.current = now;
      }

      const cx = catcherRef.current;
      let caught = 0;

      const alive = itemsRef.current
        .map((item) => ({ ...item, y: item.y + item.speed }))
        .filter((item) => {
          const isColliding =
            item.y + MINIGAME_ITEM_SIZE >= CATCHER_Y &&
            item.y <= CATCHER_Y + MINIGAME_CATCHER_HEIGHT &&
            item.x + MINIGAME_ITEM_SIZE >= cx &&
            item.x <= cx + MINIGAME_CATCHER_WIDTH;

          if (isColliding) {
            caught++;
            setCatchEffect({ x: item.x, y: item.y });
            setTimeout(() => setCatchEffect(null), MINIGAME_CATCH_EFFECT_MS);
            return false;
          }

          if (item.y > MINIGAME_FIELD_HEIGHT + MINIGAME_ITEM_DESPAWN_MARGIN) {
            return false;
          }

          return true;
        });

      if (caught > 0) {
        scoreRef.current += caught;
        setScore(scoreRef.current);
      }

      itemsRef.current = alive;
      setItems(alive);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase]);

  const handleTouchMove = useCallback((direction: CatchTouchDirection) => {
    if (direction === 'left') {
      keysPressed.current.add('ArrowLeft');
      keysPressed.current.delete('ArrowRight');
    } else {
      keysPressed.current.add('ArrowRight');
      keysPressed.current.delete('ArrowLeft');
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    keysPressed.current.delete('ArrowLeft');
    keysPressed.current.delete('ArrowRight');
  }, []);

  const handleFinish = useCallback(() => {
    minigameReward({ correctCount: score });
    closeModal();
  }, [score, minigameReward, closeModal]);

  const progressPercent = (timeLeft / MINIGAME_DURATION) * 100;
  const finalScore = phase === MINIGAME_PHASE.RESULT ? score : 0;

  return {
    minigame,
    phase,
    score,
    timeLeft,
    catcherX,
    items,
    catchEffect,
    progressPercent,
    finalScore,
    startGame,
    handleTouchMove,
    handleTouchEnd,
    handleFinish,
  };
}
