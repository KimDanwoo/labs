'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import type { CharacterPosition } from '@shared/types';
import { MOVE_SPEED, DIRECTION_CHANGE_INTERVAL, IDLE_CHANCE } from '../constants';

export function useCharacterMovement(
  _roomWidth: number,
  _roomHeight: number,
  isActive: boolean,
) {
  const [position, setPosition] = useState<CharacterPosition>({
    x: 50,
    y: 70,
    direction: 'right',
    isMoving: false,
  });

  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const directionRef = useRef<'left' | 'right'>('right');
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const pickNewTarget = useCallback(() => {
    if (Math.random() < IDLE_CHANCE) {
      targetRef.current = null;
      setPosition((prev) => ({ ...prev, isMoving: false, direction: directionRef.current }));
      return;
    }

    const newX = 10 + Math.random() * 80;
    const newY = 55 + Math.random() * 35;
    targetRef.current = { x: newX, y: newY };

    setPosition((prev) => {
      const newDir = newX > prev.x ? 'right' : 'left';
      directionRef.current = newDir;
      return { ...prev, isMoving: true, direction: newDir };
    });
  }, []);

  useEffect(() => {
    if (!isActive) {
      startTransition(() => setPosition((prev) => ({ ...prev, isMoving: false })));
      return;
    }

    const directionInterval = setInterval(pickNewTarget, DIRECTION_CHANGE_INTERVAL);
    pickNewTarget();

    return () => clearInterval(directionInterval);
  }, [isActive, pickNewTarget]);

  useEffect(() => {
    if (!isActive) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

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
            // 목표 도달 — 방향 유지한 채 멈춤
            targetRef.current = null;
            return { ...prev, x: target.x, y: target.y, isMoving: false, direction: directionRef.current };
          }

          return {
            ...prev,
            x: prev.x + (dx / dist) * step,
            y: prev.y + (dy / dist) * step,
            isMoving: true,
            direction: directionRef.current,
          };
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isActive]);

  return position;
}
