'use client';

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import type { ScWidget } from '../../api/widget';
import { validDuration } from '../../lib/widgetPayload';
import { currentIndexAtom, frameState } from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';

export function useHeldSoundSync({ tracks, refs }: PlaybackEngine) {
  const { holdsSetRef, soundIdsRef, heldIndexRef } = refs;
  const setIndex = useSetAtom(currentIndexAtom);

  return useCallback(
    (instance: ScWidget, isDisposed: () => boolean) => {
      if (!holdsSetRef.current) return;
      // 위젯이 스스로 다음 곡으로 넘어간 경우도 여기로 들어온다 — 목록 하이라이트를 여기서 맞춘다.
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
