'use client';

import { REPEAT_MODE } from '@views/player/model/constants/repeatMode';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { playableIds, resolveQueue } from '@views/player/model/queue';
import {
  currentIndexAtom,
  isPlayingAtom,
  playbackQueueAtom,
  repeatModeAtom,
  shuffleAtom,
} from '@views/player/model/store/playback';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

interface WidgetAdvanceInput {
  hasQueue: boolean;
  holdsSet: boolean;
  shuffle: boolean;
  soundIds: (number | null)[];
  trackId: number;
}

function isWidgetAdvancing({ hasQueue, holdsSet, shuffle, soundIds, trackId }: WidgetAdvanceInput): boolean {
  if (hasQueue) return false;
  if (!holdsSet) return false;
  if (shuffle) return false;
  const soundIndex = soundIds.indexOf(trackId);
  return soundIndex >= 0 && soundIndex < soundIds.length - 1;
}

type Widget = PlaybackEngine['refs']['widgetRef']['current'];

function replayCurrent(widget: Widget): void {
  widget?.seekTo(0);
  widget?.play();
}

export function useAutoAdvance({ tracks, refs }: PlaybackEngine, step: (direction: 1 | -1) => void) {
  const { widgetRef, advanceRef, holdsSetRef, soundIdsRef, shouldRewindRef } = refs;
  const index = useAtomValue(currentIndexAtom);
  const queue = useAtomValue(playbackQueueAtom);
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);

  useEffect(() => {
    advanceRef.current = () => {
      if (repeatMode === REPEAT_MODE.one) {
        replayCurrent(widgetRef.current);
        return;
      }

      const currentId = tracks[index]?.id ?? -1;
      const widgetAdvances = isWidgetAdvancing({
        hasQueue: Boolean(queue),
        holdsSet: holdsSetRef.current,
        shuffle,
        soundIds: soundIdsRef.current,
        trackId: currentId,
      });
      if (widgetAdvances) {
        shouldRewindRef.current = true;
        return;
      }

      const ids = queue ? resolveQueue(tracks, queue.ids) : playableIds(tracks);
      const isLastTrack = tracks[index]?.id === ids.at(-1);
      const shouldStopAtEnd = isLastTrack && repeatMode === REPEAT_MODE.off;
      if (shouldStopAtEnd) {
        widgetRef.current?.pause();
        setIsPlaying(false);
        return;
      }
      step(1);
    };
  }, [
    advanceRef,
    holdsSetRef,
    index,
    queue,
    repeatMode,
    setIsPlaying,
    shouldRewindRef,
    shuffle,
    soundIdsRef,
    step,
    tracks,
    widgetRef,
  ]);
}
