'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import type { CharacterPosition, SpriteDirection } from '@shared/types';
import { MOVE_SPEED, IDLE_CHANCE, IDLE_PAUSE_MIN_MS, IDLE_PAUSE_MAX_MS } from '../constants';

const X_MIN = 10;
const X_MAX = 90;
const Y_MIN = 55;
const Y_MAX = 90;
const DIRECTION_THRESHOLD = 0.5;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sideDirection = (
  fromX: number,
  toX: number,
  fallback: SpriteDirection,
): 'left' | 'right' => {
  if (toX > fromX + DIRECTION_THRESHOLD) return 'right';
  if (toX < fromX - DIRECTION_THRESHOLD) return 'left';
  return fallback === 'left' ? 'left' : 'right';
};

export function useCharacterMovement(
  _roomWidth: number,
  _roomHeight: number,
  isActive: boolean,
) {
  const [position, setPosition] = useState<CharacterPosition>({
    x: 50,
    y: 70,
    direction: 'front',
    isMoving: false,
  });

  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const setTarget = useCallback((x: number, y: number) => {
    const safeX = clamp(x, X_MIN, X_MAX);
    const safeY = clamp(y, Y_MIN, Y_MAX);
    targetRef.current = { x: safeX, y: safeY };
    clearIdleTimer();
    setPosition((prev) => ({
      ...prev,
      isMoving: true,
      direction: sideDirection(prev.x, safeX, prev.direction),
    }));
  }, [clearIdleTimer]);

  const scheduleNextAutoMove = useCallback(() => {
    clearIdleTimer();
    const pause = IDLE_PAUSE_MIN_MS + Math.random() * (IDLE_PAUSE_MAX_MS - IDLE_PAUSE_MIN_MS);
    idleTimerRef.current = setTimeout(() => {
      if (Math.random() < IDLE_CHANCE) {
        scheduleNextAutoMove();
        return;
      }
      const nextX = X_MIN + Math.random() * (X_MAX - X_MIN);
      const nextY = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
      setTarget(nextX, nextY);
    }, pause);
  }, [clearIdleTimer, setTarget]);

  useEffect(() => {
    if (!isActive) {
      clearIdleTimer();
      targetRef.current = null;
      startTransition(() => setPosition((prev) => ({ ...prev, isMoving: false, direction: 'front' })));
      return;
    }

    scheduleNextAutoMove();
    return () => clearIdleTimer();
  }, [isActive, scheduleNextAutoMove, clearIdleTimer]);

  useEffect(() => {
    if (!isActive) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const target = targetRef.current;
      if (target) {
        setPosition((prev) => {
          const dx = target.x - prev.x;
          const dy = target.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = MOVE_SPEED * delta;

          if (dist < step) {
            targetRef.current = null;
            scheduleNextAutoMove();
            return {
              ...prev,
              x: target.x,
              y: target.y,
              isMoving: false,
              direction: 'front',
            };
          }

          return {
            ...prev,
            x: prev.x + (dx / dist) * step,
            y: prev.y + (dy / dist) * step,
            isMoving: true,
          };
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isActive, scheduleNextAutoMove]);

  return { position, moveTo: setTarget };
}
