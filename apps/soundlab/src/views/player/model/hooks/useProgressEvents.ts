'use client';

import type { ScWidget } from '@views/player/api/widget';
import { REWIND_ATTEMPT_LIMIT, WIDGET_EVENT } from '@views/player/config/playback';
import { hasLostRewind, isRewindWatched } from '@views/player/lib/rewindGuard';
import { isValidPosition } from '@views/player/lib/widgetPayload';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { writeBuffered } from '@views/player/model/store/playback';
import { useCallback } from 'react';

export function useProgressEvents({ tracks, refs, clock, listening, lastPlayed }: PlaybackEngine) {
  const { playingRef, heldIndexRef, pendingRewindRef } = refs;
  const { anchor, report } = clock;
  const { track: trackListening } = listening;
  const { rememberIfDue } = lastPlayed;

  return useCallback(
    (instance: ScWidget) => {
      const isRewinding = (position: number) => {
        const pending = pendingRewindRef.current;
        if (!pending) return false;
        const now = performance.now();
        const hasGivenUpRewind = !isRewindWatched(pending, now) || pending.attempts >= REWIND_ATTEMPT_LIMIT;
        if (hasGivenUpRewind) {
          pendingRewindRef.current = null;
          return false;
        }
        if (!hasLostRewind(pending, position, now)) return false;
        pendingRewindRef.current = { ms: pending.ms, since: now, attempts: pending.attempts + 1 };
        instance.seekTo(pending.ms);
        anchor(pending.ms);
        return true;
      };
      instance.bind(WIDGET_EVENT.progress, (payload) => {
        writeBuffered(payload.loadedProgress);
        if (!isValidPosition(payload.currentPosition)) return;
        if (isRewinding(payload.currentPosition)) return;
        trackListening(tracks[heldIndexRef.current]?.id ?? 0, payload.currentPosition, playingRef.current);
        report(payload.currentPosition);
        rememberIfDue(payload.currentPosition);
      });
      instance.bind(WIDGET_EVENT.buffer, (payload) => writeBuffered(payload.loadedProgress));
    },
    [anchor, heldIndexRef, pendingRewindRef, playingRef, rememberIfDue, report, trackListening, tracks],
  );
}
