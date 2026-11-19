'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { type PlaybackQueue, adjacentTrack, playableIds, resolveQueue } from '../queue';
import { currentIndexAtom, playbackQueueAtom, resumeNoticeAtom, shuffleAtom } from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';
import type { GoTo } from './useTrackSwitch';

export function useQueueSteps({ tracks, refs, queueRef, listening }: PlaybackEngine, goTo: GoTo) {
  const { resumeRef } = refs;
  const { flush: flushListening } = listening;
  const [index, setIndex] = useAtom(currentIndexAtom);
  const [queue, setQueue] = useAtom(playbackQueueAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);
  const shuffle = useAtomValue(shuffleAtom);

  const startQueue = useCallback(
    (requested: PlaybackQueue) => {
      const ids = resolveQueue(tracks, requested.ids);
      const next = tracks.findIndex((track) => track.id === ids[0]);
      const track = tracks[next];
      if (!track) return;
      flushListening();
      const nextQueue = { ids, label: requested.label };
      queueRef.current = nextQueue;
      setQueue(nextQueue);
      setResumeNotice(null);
      resumeRef.current = null;
      setIndex(next);
      goTo(next, track);
    },
    [flushListening, goTo, queueRef, resumeRef, setIndex, setQueue, setResumeNotice, tracks],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      const ids = queue ? resolveQueue(tracks, queue.ids) : playableIds(tracks);
      const id = adjacentTrack({
        ids,
        currentId: tracks[index]?.id ?? -1,
        direction,
        random: shuffle && direction === 1 ? Math.random() : undefined,
      });
      const next = tracks.findIndex((track) => track.id === id);
      const track = tracks[next];
      if (!track) return;
      setIndex(next);
      goTo(next, track);
    },
    [goTo, index, queue, setIndex, shuffle, tracks],
  );

  return { startQueue, step };
}
