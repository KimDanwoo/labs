'use client';

import type { Track } from '@entities/track';
import type { ScWidget } from '@views/player/api/widget';
import type { PendingRewind } from '@views/player/lib/rewindGuard';
import type { useLastPlayed } from '@views/player/model/hooks/useLastPlayed';
import type { useListeningLog } from '@views/player/model/hooks/useListeningLog';
import type { usePlaybackClock } from '@views/player/model/hooks/usePlaybackClock';
import type { useVolumeFade } from '@views/player/model/hooks/useVolumeFade';
import type { PlaybackQueue } from '@views/player/model/queue';
import { type RefObject, useRef } from 'react';

export interface EngineRefs {
  widgetRef: RefObject<ScWidget | null>;
  readyRef: RefObject<boolean>;
  playingRef: RefObject<boolean>;
  advanceRef: RefObject<() => void>;
  holdsSetRef: RefObject<boolean>;
  soundIdsRef: RefObject<(number | null)[]>;
  heldIndexRef: RefObject<number>;
  shouldRewindRef: RefObject<boolean>;
  pendingRewindRef: RefObject<PendingRewind | null>;
  pauseAfterSwitchRef: RefObject<boolean>;
  resumeRef: RefObject<{ index: number; ms: number } | null>;
  goSeqRef: RefObject<number>;
  queuedRef: RefObject<number | null>;
  flushQueuedRef: RefObject<() => void>;
}

export interface PlaybackEngine {
  tracks: readonly Track[];
  refs: EngineRefs;
  queueRef: RefObject<PlaybackQueue | null>;
  clock: ReturnType<typeof usePlaybackClock>;
  listening: ReturnType<typeof useListeningLog>;
  volume: ReturnType<typeof useVolumeFade>;
  lastPlayed: ReturnType<typeof useLastPlayed>;
}

export function useEngineRefs(): EngineRefs {
  const widgetRef = useRef<ScWidget | null>(null);
  const readyRef = useRef(false);
  const playingRef = useRef(false);
  const advanceRef = useRef<() => void>(() => {});
  const holdsSetRef = useRef(false);
  const soundIdsRef = useRef<(number | null)[]>([]);
  const heldIndexRef = useRef(-1);
  const shouldRewindRef = useRef(false);
  const pendingRewindRef = useRef<PendingRewind | null>(null);
  const pauseAfterSwitchRef = useRef(false);
  const resumeRef = useRef<{ index: number; ms: number } | null>(null);
  const goSeqRef = useRef(0);
  const queuedRef = useRef<number | null>(null);
  const flushQueuedRef = useRef<() => void>(() => {});

  return {
    widgetRef,
    readyRef,
    playingRef,
    advanceRef,
    holdsSetRef,
    soundIdsRef,
    heldIndexRef,
    shouldRewindRef,
    pendingRewindRef,
    pauseAfterSwitchRef,
    resumeRef,
    goSeqRef,
    queuedRef,
    flushQueuedRef,
  };
}
