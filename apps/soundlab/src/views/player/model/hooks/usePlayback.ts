'use client';

import type { Track } from '@entities/track';
import { type PlaybackEngine, useEngineRefs } from '@views/player/model/hooks/useEngineRefs';
import { useLastPlayed } from '@views/player/model/hooks/useLastPlayed';
import { useListeningLog } from '@views/player/model/hooks/useListeningLog';
import { usePlaybackClock } from '@views/player/model/hooks/usePlaybackClock';
import { useSeekCommands } from '@views/player/model/hooks/useSeekCommands';
import { useStartTarget } from '@views/player/model/hooks/useStartTarget';
import { useTrackCommands } from '@views/player/model/hooks/useTrackCommands';
import { useTrackSwitch } from '@views/player/model/hooks/useTrackSwitch';
import { useVolumeFade } from '@views/player/model/hooks/useVolumeFade';
import { useWidgetEngine } from '@views/player/model/hooks/useWidgetEngine';
import type { PlaybackQueue } from '@views/player/model/queue';
import { isPlayingAtom, playbackQueueAtom } from '@views/player/model/store/playback';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

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
