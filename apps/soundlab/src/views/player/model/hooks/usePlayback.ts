'use client';

import type { Track } from '@entities/track';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import type { PlaybackQueue } from '../queue';
import { isPlayingAtom, playbackQueueAtom } from '../store/playback';
import { type PlaybackEngine, useEngineRefs } from './useEngineRefs';
import { useLastPlayed } from './useLastPlayed';
import { useListeningLog } from './useListeningLog';
import { usePlaybackClock } from './usePlaybackClock';
import { useSeekCommands } from './useSeekCommands';
import { useStartTarget } from './useStartTarget';
import { useTrackCommands } from './useTrackCommands';
import { useTrackSwitch } from './useTrackSwitch';
import { useVolumeFade } from './useVolumeFade';
import { useWidgetEngine } from './useWidgetEngine';

export type Playback = {
  startQueue: (queue: PlaybackQueue) => void;
  retry: () => void;
  playFrom: (ms: number) => void;
  select: (index: number) => void;
  toggle: () => void;
  step: (direction: 1 | -1) => void;
  seek: (ratio: number) => void;
  seekBy: (seconds: number) => void;
};

export function usePlayback(tracks: readonly Track[], initialTrackId?: number): Playback {
  const isPlaying = useAtomValue(isPlayingAtom);
  const queue = useAtomValue(playbackQueueAtom);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const queueRef = useRef(queue);
  const refs = useEngineRefs();
  const clock = usePlaybackClock(refs.playingRef);
  const listening = useListeningLog(queueRef);
  const volume = useVolumeFade();
  const lastPlayed = useLastPlayed(tracks, refs.heldIndexRef);
  const engine: PlaybackEngine = { tracks, refs, queueRef, clock, listening, volume, lastPlayed };
  const { playingRef } = refs;
  const { reportedMs } = clock;
  const { flush: flushListening } = listening;
  const { remember } = lastPlayed;

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying, playingRef]);

  useEffect(() => {
    const onHide = () => {
      remember(reportedMs());
      flushListening();
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [flushListening, remember, reportedMs]);

  useStartTarget(engine, initialTrackId);
  useWidgetEngine(engine, retryGeneration);
  const goTo = useTrackSwitch(engine);
  const { select, toggle, step, startQueue } = useTrackCommands(engine, goTo);
  const { seek, seekBy, playFrom, retry } = useSeekCommands(engine, goTo, setRetryGeneration);

  return { select, toggle, step, seek, seekBy, startQueue, retry, playFrom };
}
