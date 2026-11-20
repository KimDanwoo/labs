'use client';

import { loadWidgetApi, mountEngineFrame, readSoundIds, setUrl, trackUrl, widgetSrc } from '@views/player/api/widget';
import { PLAYBACK_MESSAGE, READY_TIMEOUT_MS, WIDGET_EVENT } from '@views/player/config/playback';
import { validDuration } from '@views/player/lib/widgetPayload';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { usePlaybackEvents } from '@views/player/model/hooks/usePlaybackEvents';
import { useProgressEvents } from '@views/player/model/hooks/useProgressEvents';
import {
  engineErrorAtom,
  engineModeAtom,
  frameState,
  isPlayingAtom,
  isReadyAtom,
} from '@views/player/model/store/playback';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

export function useWidgetEngine(engine: PlaybackEngine, retryGeneration: number) {
  const { tracks, refs, listening, volume } = engine;
  const {
    widgetRef,
    readyRef,
    playingRef,
    holdsSetRef,
    soundIdsRef,
    heldIndexRef,
    pendingRewindRef,
    pauseAfterSwitchRef,
    flushQueuedRef,
  } = refs;
  const { flush: flushListening } = listening;
  const { stopFade } = volume;
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setIsReady = useSetAtom(isReadyAtom);
  const setEngineError = useSetAtom(engineErrorAtom);
  const setEngineMode = useSetAtom(engineModeAtom);
  const bindPlaybackEvents = usePlaybackEvents(engine);
  const bindProgressEvents = useProgressEvents(engine);

  useEffect(() => {
    let disposed = false;
    const first = tracks[0];
    const frame = mountEngineFrame(widgetSrc(setUrl(tracks) ?? (first ? trackUrl(first) : '')));

    const readyTimer = setTimeout(() => {
      setEngineError(PLAYBACK_MESSAGE.engineBlocked);
      setIsReady(false);
    }, READY_TIMEOUT_MS);

    loadWidgetApi()
      .then((sc) => {
        if (disposed) return;
        const instance = sc.Widget(frame);
        widgetRef.current = instance;

        instance.bind(WIDGET_EVENT.ready, () => {
          if (disposed) return;
          instance.getSounds((sounds) => {
            if (disposed) return;
            clearTimeout(readyTimer);
            setEngineError(null);
            soundIdsRef.current = readSoundIds(sounds);
            holdsSetRef.current = soundIdsRef.current.length > 1;
            setEngineMode(holdsSetRef.current ? 'set' : 'single');
            // soundIds가 채워진 뒤에 열어야 skip 경로가 올바른 위치를 찾는다.
            readyRef.current = true;
            setIsReady(true);
            flushQueuedRef.current();
          });
          instance.getDuration((ms) => {
            if (disposed) return;
            frameState.durationMs = validDuration(ms, frameState.durationMs);
          });
        });

        bindPlaybackEvents(instance, () => disposed);
        bindProgressEvents(instance);
      })
      .catch(() => {
        if (disposed) return;
        clearTimeout(readyTimer);
        setEngineError(PLAYBACK_MESSAGE.engineFailed);
      });

    return () => {
      disposed = true;
      flushListening();
      const owned = widgetRef.current;
      widgetRef.current = null;
      readyRef.current = false;
      heldIndexRef.current = -1;
      holdsSetRef.current = false;
      pendingRewindRef.current = null;
      soundIdsRef.current = [];
      playingRef.current = false;
      pauseAfterSwitchRef.current = false;
      for (const event of Object.values(WIDGET_EVENT)) owned?.unbind(event);
      setIsReady(false);
      setIsPlaying(false);
      clearTimeout(readyTimer);
      stopFade();
      frame.remove();
    };
  }, [
    bindPlaybackEvents,
    bindProgressEvents,
    flushListening,
    flushQueuedRef,
    heldIndexRef,
    holdsSetRef,
    pauseAfterSwitchRef,
    pendingRewindRef,
    playingRef,
    readyRef,
    retryGeneration,
    setEngineError,
    setEngineMode,
    setIsPlaying,
    setIsReady,
    soundIdsRef,
    stopFade,
    tracks,
    widgetRef,
  ]);
}
