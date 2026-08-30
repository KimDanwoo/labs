'use client';

import { SWIPE_THRESHOLD } from '@views/character-select/model/constants';
import { useCallback, useRef } from 'react';

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
};

export function usePointerSwipe({ onSwipeLeft, onSwipeRight, threshold = SWIPE_THRESHOLD }: SwipeHandlers) {
  const startXRef = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (startXRef.current === null) return;
      const diff = e.clientX - startXRef.current;
      startXRef.current = null;
      if (Math.abs(diff) < threshold) return;
      if (diff > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  const onPointerCancel = useCallback(() => {
    startXRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
