'use client';

import type { ScWidget } from '@views/player/api/widget';
import { validDuration } from '@views/player/lib/widgetPayload';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { currentIndexAtom, frameState } from '@views/player/model/store/playback';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

export function useHeldSoundSync({ tracks, refs }: PlaybackEngine) {
  const { holdsSetRef, soundIdsRef, heldIndexRef } = refs;
  const setIndex = useSetAtom(currentIndexAtom);

  return useCallback(
    (instance: ScWidget, isDisposed: () => boolean) => {
      if (!holdsSetRef.current) return;
      instance.getCurrentSoundIndex((soundIndex) => {
        const id = soundIdsRef.current[soundIndex];
        if (typeof id !== 'number') return;
        const next = tracks.findIndex((track) => track.id === id);
        if (next < 0) return;
        heldIndexRef.current = next;
        setIndex(next);
      });
      instance.getDuration((ms) => {
        if (isDisposed()) return;
        frameState.durationMs = validDuration(ms, frameState.durationMs);
      });
    },
    [heldIndexRef, holdsSetRef, setIndex, soundIdsRef, tracks],
  );
}
