'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterPosition } from '@shared/types';
import {
  DIRECTION_CHANGE_INTERVAL,
  IDLE_CHANCE,
  MOVE_SPEED,
} from '../constants';

const INITIAL: CharacterPosition = {
  x: 40,
  y: 68,
  direction: 'left',
  isMoving: false,
};

/** 공원 놀기 장면에서 친구 캐릭터가 내 캐릭터처럼 돌아다니게 한다(로컬 상태). */
export function useFriendWander(active: boolean): CharacterPosition {
  const [position, setPosition] = useState<CharacterPosition>(INITIAL);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);

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
  }, []);

  useEffect(() => {
    if (!active) return;
    const kickoff = setTimeout(pickNewTarget, 0);
    const interval = setInterval(pickNewTarget, DIRECTION_CHANGE_INTERVAL);
    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [active, pickNewTarget]);

  useEffect(() => {
    if (!active) return;

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
  }, [active]);

  return position;
}
