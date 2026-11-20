'use client';

import { useAutoAdvance } from '@views/player/model/hooks/useAutoAdvance';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { usePlayPause } from '@views/player/model/hooks/usePlayPause';
import { useQueueSteps } from '@views/player/model/hooks/useQueueSteps';
import type { GoTo } from '@views/player/model/hooks/useTrackSwitch';
import { currentIndexAtom, playbackQueueAtom, resumeNoticeAtom } from '@views/player/model/store/playback';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

const PLAY_CURRENT = -1;

export function useTrackCommands(engine: PlaybackEngine, goTo: GoTo) {
  const { tracks, refs, queueRef, listening } = engine;
  const { widgetRef, readyRef, playingRef, queuedRef, flushQueuedRef } = refs;
  const { flush: flushListening } = listening;
  const [index, setIndex] = useAtom(currentIndexAtom);
  const setQueue = useSetAtom(playbackQueueAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);
  const { pause, start } = usePlayPause(engine, goTo);
  const { startQueue, step } = useQueueSteps(engine, goTo);
  useAutoAdvance(engine, step);

  const select = useCallback(
    (next: number) => {
      const track = tracks[next];
      if (!track) return;
      if (track.isAvailable === false) return;
      const isOutsideQueue = queueRef.current && !queueRef.current.ids.includes(track.id);
      if (isOutsideQueue) {
        flushListening();
        queueRef.current = null;
        setQueue(null);
      }
      setResumeNotice(null);
      if (next === index) {
        const instance = widgetRef.current;
        const isWidgetPending = !instance || !readyRef.current;
        if (isWidgetPending) {
          queuedRef.current = next;
          return;
        }
        if (playingRef.current) pause(instance);
        else start(instance);
        return;
      }
      setIndex(next);
      goTo(next, track);
    },
    [
      flushListening,
      goTo,
      index,
      pause,
      playingRef,
      queueRef,
      queuedRef,
      readyRef,
      setIndex,
      setQueue,
      setResumeNotice,
      start,
      tracks,
      widgetRef,
    ],
  );

  const toggle = useCallback(() => {
    if (tracks[index]?.isAvailable === false) return;
    const instance = widgetRef.current;
    const isSeekWidgetPending = !instance || !readyRef.current;
    if (isSeekWidgetPending) {
      queuedRef.current = PLAY_CURRENT;
      return;
    }
    if (playingRef.current) pause(instance);
    else start(instance);
  }, [index, pause, playingRef, queuedRef, readyRef, start, tracks, widgetRef]);

  useEffect(() => {
    flushQueuedRef.current = () => {
      const target = queuedRef.current;
      queuedRef.current = null;
      if (target === null) return;
      const resolved = target === PLAY_CURRENT ? index : target;
      const track = tracks[resolved];
      if (track) goTo(resolved, track);
    };
  }, [flushQueuedRef, goTo, index, queuedRef, tracks]);

  return { select, toggle, step, startQueue };
}
