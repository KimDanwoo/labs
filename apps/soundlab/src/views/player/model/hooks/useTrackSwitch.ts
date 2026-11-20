'use client';

import type { Track } from '@entities/track';
import { readSoundIds, setUrl, trackUrl } from '@views/player/api/widget';
import { validDuration } from '@views/player/lib/widgetPayload';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { engineErrorAtom, engineModeAtom, frameState } from '@views/player/model/store/playback';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

export type GoTo = (next: number, track: Track) => void;

export function useTrackSwitch({ tracks, refs, queueRef, clock, listening, volume }: PlaybackEngine): GoTo {
  const {
    widgetRef,
    readyRef,
    queuedRef,
    goSeqRef,
    shouldRewindRef,
    pendingRewindRef,
    pauseAfterSwitchRef,
    resumeRef,
    heldIndexRef,
    soundIdsRef,
    holdsSetRef,
  } = refs;
  const { anchor } = clock;
  const { flush: flushListening, restart: restartListening } = listening;
  const { silence } = volume;
  const setEngineError = useSetAtom(engineErrorAtom);
  const setEngineMode = useSetAtom(engineModeAtom);

  return useCallback(
    (next: number, track: Track) => {
      if (track.isAvailable === false) return;
      flushListening();
      restartListening(track.id);
      setEngineError(null);
      const instance = widgetRef.current;
      const isWidgetPending = !instance || !readyRef.current;
      if (isWidgetPending) {
        queuedRef.current = next;
        return;
      }
      const seq = ++goSeqRef.current;
      const stale = () => goSeqRef.current !== seq || widgetRef.current !== instance || !readyRef.current;
      anchor(0);
      shouldRewindRef.current = true;
      pendingRewindRef.current = null;
      pauseAfterSwitchRef.current = false;
      if (resumeRef.current?.index !== next) resumeRef.current = null;
      heldIndexRef.current = next;
      frameState.position = 0;
      frameState.buffered = 0;
      frameState.durationMs = track.durationMs;
      silence(instance);

      const readDuration = () =>
        instance.getDuration((ms) => {
          if (stale()) return;
          frameState.durationMs = validDuration(ms, track.durationMs);
        });

      instance.getSounds((sounds) => {
        if (stale()) return;
        soundIdsRef.current = readSoundIds(sounds);
        const soundIndex = soundIdsRef.current.indexOf(track.id);

        const shouldHoldSet = soundIndex >= 0 && holdsSetRef.current && !queueRef.current;
        if (shouldHoldSet) {
          instance.getCurrentSoundIndex((current) => {
            if (stale()) return;
            if (current === soundIndex) instance.play();
            else instance.skip(soundIndex);
          });
          return;
        }

        const isSetTrack = soundIndex >= 0 && !queueRef.current;
        const target = isSetTrack ? setUrl(tracks) : null;
        if (target) {
          instance.load(target, {
            auto_play: true,
            callback: () => {
              if (stale()) return;
              holdsSetRef.current = true;
              setEngineMode('set');
              instance.skip(soundIndex);
              readDuration();
            },
          });
          return;
        }

        holdsSetRef.current = false;
        setEngineMode('single');
        instance.load(trackUrl(track), {
          auto_play: true,
          show_artwork: false,
          show_comments: false,
          callback: readDuration,
        });
      });
    },
    [
      anchor,
      flushListening,
      goSeqRef,
      heldIndexRef,
      holdsSetRef,
      pauseAfterSwitchRef,
      pendingRewindRef,
      queueRef,
      queuedRef,
      readyRef,
      restartListening,
      resumeRef,
      setEngineError,
      setEngineMode,
      shouldRewindRef,
      silence,
      soundIdsRef,
      tracks,
      widgetRef,
    ],
  );
}
