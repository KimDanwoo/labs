'use client';

import type { ScWidget } from '@views/player/api/widget';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import type { GoTo } from '@views/player/model/hooks/useTrackSwitch';
import { currentIndexAtom } from '@views/player/model/store/playback';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

export function usePlayPause({ tracks, refs, volume }: PlaybackEngine, goTo: GoTo) {
  const { heldIndexRef, shouldRewindRef, pauseAfterSwitchRef } = refs;
  const { playFaded, pauseFaded } = volume;
  const index = useAtomValue(currentIndexAtom);

  // 곡을 바꾸는 도중에는 위젯이 새 곡을 곧 재생하므로, 지금 멈춰도 다시 튼다 — 새 곡이 시작되는 순간에 멈춘다
  const pause = useCallback(
    (instance: ScWidget) => {
      pauseAfterSwitchRef.current = shouldRewindRef.current;
      pauseFaded(instance);
    },
    [pauseAfterSwitchRef, pauseFaded, shouldRewindRef],
  );

  const start = useCallback(
    (instance: ScWidget) => {
      pauseAfterSwitchRef.current = false;
      const track = tracks[index];
      if (heldIndexRef.current === index || !track) {
        playFaded(instance);
        return;
      }
      goTo(index, track);
    },
    [goTo, heldIndexRef, index, pauseAfterSwitchRef, playFaded, tracks],
  );

  return { pause, start };
}
