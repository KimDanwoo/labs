'use client';

import { MS_PER_SECOND } from '@views/player/config/time';
import { validDuration } from '@views/player/lib/widgetPayload';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import type { GoTo } from '@views/player/model/hooks/useTrackSwitch';
import {
  currentIndexAtom,
  engineErrorAtom,
  frameState,
  recoveryNoticeAtom,
  resumeNoticeAtom,
} from '@views/player/model/store/playback';
import { useAtomValue, useSetAtom } from 'jotai';
import { type Dispatch, type SetStateAction, useCallback, useEffect } from 'react';

export function useSeekCommands(
  { tracks, refs, clock, volume }: PlaybackEngine,
  goTo: GoTo,
  setRetryGeneration: Dispatch<SetStateAction<number>>,
) {
  const { widgetRef, readyRef, heldIndexRef, pendingRewindRef, pauseAfterSwitchRef, resumeRef, queuedRef } = refs;
  const { reportedMs, settle } = clock;
  const { playFaded } = volume;
  const index = useAtomValue(currentIndexAtom);
  const setEngineError = useSetAtom(engineErrorAtom);
  const setRecoveryNotice = useSetAtom(recoveryNoticeAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);

  const retry = useCallback(() => {
    const track = tracks[index];
    if (!track) return;
    if (track.isAvailable === false) return;
    resumeRef.current = { index, ms: Math.max(0, reportedMs()) };
    heldIndexRef.current = -1;
    queuedRef.current = index;
    readyRef.current = false;
    setEngineError(null);
    setRecoveryNotice(true);
    setRetryGeneration((generation) => generation + 1);
  }, [
    heldIndexRef,
    index,
    queuedRef,
    readyRef,
    reportedMs,
    resumeRef,
    setEngineError,
    setRecoveryNotice,
    setRetryGeneration,
    tracks,
  ]);

  const playFrom = useCallback(
    (ms: number) => {
      const track = tracks[index];
      if (!track) return;
      if (track.isAvailable === false) return;
      if (!Number.isFinite(ms)) return;
      const position = Math.min(track.durationMs - 1, Math.max(0, ms));
      const instance = widgetRef.current;
      const canSeekInPlace = instance && readyRef.current && heldIndexRef.current === index;
      if (canSeekInPlace) {
        pendingRewindRef.current = null;
        instance.seekTo(position);
        settle(position);
        frameState.position = position / track.durationMs;
        resumeRef.current = null;
        setResumeNotice(null);
        pauseAfterSwitchRef.current = false;
        playFaded(instance);
        return;
      }
      resumeRef.current = { index, ms: position };
      goTo(index, track);
    },
    [
      goTo,
      heldIndexRef,
      index,
      pauseAfterSwitchRef,
      pendingRewindRef,
      playFaded,
      readyRef,
      resumeRef,
      setResumeNotice,
      settle,
      tracks,
      widgetRef,
    ],
  );

  const seek = useCallback(
    (ratio: number) => {
      if (!Number.isFinite(ratio)) return;
      const clamped = Math.min(1, Math.max(0, ratio));
      const ms = clamped * frameState.durationMs;
      pendingRewindRef.current = null;
      settle(ms);
      frameState.position = clamped;
      widgetRef.current?.seekTo(ms);
    },
    [pendingRewindRef, settle, widgetRef],
  );

  const seekBy = useCallback(
    (seconds: number) => {
      if (frameState.durationMs === 0) return;
      seek(frameState.position + (seconds * MS_PER_SECOND) / frameState.durationMs);
    },
    [seek],
  );

  useEffect(() => {
    const track = tracks[index];
    if (track) frameState.durationMs = validDuration(frameState.durationMs, track.durationMs);
  }, [index, tracks]);

  return { seek, seekBy, playFrom, retry };
}
