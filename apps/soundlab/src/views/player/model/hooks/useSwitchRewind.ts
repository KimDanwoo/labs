'use client';

import { useCallback } from 'react';
import type { ScWidget } from '../../api/widget';
import type { PlaybackEngine } from './useEngineRefs';

export function useSwitchRewind({ refs, clock }: PlaybackEngine) {
  const { shouldRewindRef, resumeRef, pendingRewindRef, pauseAfterSwitchRef } = refs;
  const { anchor } = clock;

  return useCallback(
    (instance: ScWidget) => {
      if (!shouldRewindRef.current) return false;
      shouldRewindRef.current = false;
      const at = resumeRef.current?.ms ?? 0;
      resumeRef.current = null;
      instance.seekTo(at);
      anchor(at);
      pendingRewindRef.current = { ms: at, since: performance.now(), attempts: 0 };
      if (!pauseAfterSwitchRef.current) return false;
      pauseAfterSwitchRef.current = false;
      instance.pause();
      return true;
    },
    [anchor, pauseAfterSwitchRef, pendingRewindRef, resumeRef, shouldRewindRef],
  );
}
