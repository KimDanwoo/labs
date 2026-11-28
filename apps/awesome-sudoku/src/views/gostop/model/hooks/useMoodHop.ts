'use client';

import { MOOD_HOP } from '@views/gostop/config/rival';
import type { Mood } from '@views/gostop/model/types/rival';
import { useEffect, type RefObject } from 'react';

export const useMoodHop = (frameRef: RefObject<HTMLElement | null>, mood: Mood, isReducedMotion: boolean) => {
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    if (isReducedMotion) return undefined;
    const animation = frame.animate(
      MOOD_HOP.frames.map((keyframe) => ({ ...keyframe })),
      {
        duration: MOOD_HOP.durationMs,
        easing: MOOD_HOP.easing,
      },
    );
    return () => animation.cancel();
  }, [frameRef, mood, isReducedMotion]);
};
