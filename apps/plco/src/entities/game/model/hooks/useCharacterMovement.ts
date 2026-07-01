'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { MOVE_SPEED, DIRECTION_CHANGE_INTERVAL, IDLE_CHANCE } from '../constants';
import { characterPositionAtom, isPlayingAtom, isSleepingAtom } from '../store';

export function useCharacterMovement() {
  const isPlaying = useAtomValue(isPlayingAtom);
  const isSleeping = useAtomValue(isSleepingAtom);
  const setPosition = useSetAtom(characterPositionAtom);
  const isActive = isPlaying && !isSleeping;

  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const pickNewTarget = useCallback(() => {
    if (Math.random() < IDLE_CHANCE) {
      targetRef.current = null;
      setPosition((prev) => ({ ...prev, isMoving: false }));
      return;
    }

    const newX = 10 + Math.random() * 80;
    const newY = 55 + Math.random() * 35;
    targetRef.current = { x: newX, y: newY };
    setPosition((prev) => ({
      ...prev,
      isMoving: true,
      direction: newX > prev.x ? 'right' : 'left',
    }));
  }, [setPosition]);

  useEffect(() => {
    if (!isActive) {
      setPosition((prev) => ({ ...prev, isMoving: false }));
      return;
    }

    const directionInterval = setInterval(pickNewTarget, DIRECTION_CHANGE_INTERVAL);
    pickNewTarget();

    return () => clearInterval(directionInterval);
  }, [isActive, pickNewTarget, setPosition]);

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
            targetRef.current = null;
            return { ...prev, x: target.x, y: target.y, isMoving: false };
          }

          return {
            ...prev,
            x: prev.x + (dx / dist) * step,
            y: prev.y + (dy / dist) * step,
            direction: dx > 0 ? 'right' : 'left',
            isMoving: true,
          };
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isActive, setPosition]);
}
