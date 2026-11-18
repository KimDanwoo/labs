'use client';

import type { Track } from '@entities/track';
import { type RefObject, useCallback, useRef } from 'react';
import { SAVE_INTERVAL_MS } from '../../config/playback';
import { writeLastPlayed } from '../lastPlayed';

export function useLastPlayed(tracks: readonly Track[], heldIndex: RefObject<number>) {
  const savedAt = useRef(0);

  const remember = useCallback(
    (ms: number) => {
      const track = tracks[heldIndex.current];
      if (!track || !Number.isFinite(ms)) return;
      savedAt.current = performance.now();
      writeLastPlayed({ id: track.id, ms: Math.round(Math.max(0, ms)) });
    },
    [heldIndex, tracks],
  );

  const rememberIfDue = useCallback(
    (ms: number) => {
      if (performance.now() - savedAt.current >= SAVE_INTERVAL_MS) remember(ms);
    },
    [remember],
  );

  return { remember, rememberIfDue };
}
