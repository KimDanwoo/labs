'use client';

import type { ScWidget } from '@views/player/api/widget';
import { PLAYBACK_MESSAGE, WIDGET_EVENT } from '@views/player/config/playback';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { useHeldSoundSync } from '@views/player/model/hooks/useHeldSoundSync';
import { useSwitchRewind } from '@views/player/model/hooks/useSwitchRewind';
import {
  engineErrorAtom,
  isPlayingAtom,
  recoveryNoticeAtom,
  resumeNoticeAtom,
} from '@views/player/model/store/playback';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

export function usePlaybackEvents(engine: PlaybackEngine) {
  const { refs, clock, listening, volume, lastPlayed } = engine;
  const { playingRef, advanceRef } = refs;
  const { anchor, interpolated, reportedMs } = clock;
  const { flush: flushListening } = listening;
  const { restoreVolume } = volume;
  const { remember } = lastPlayed;
  const rewindOnSwitch = useSwitchRewind(engine);
  const syncHeldSound = useHeldSoundSync(engine);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setEngineError = useSetAtom(engineErrorAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);
  const setRecoveryNotice = useSetAtom(recoveryNoticeAtom);

  return useCallback(
    (instance: ScWidget, isDisposed: () => boolean) => {
      instance.bind(WIDGET_EVENT.play, () => {
        anchor(interpolated());
        if (rewindOnSwitch(instance)) return;
        restoreVolume(instance);
        playingRef.current = true;
        setIsPlaying(true);
        setResumeNotice(null);
        setRecoveryNotice(false);
        setEngineError(null);
        syncHeldSound(instance, isDisposed);
      });
      instance.bind(WIDGET_EVENT.pause, () => {
        anchor(interpolated());
        remember(reportedMs());
        flushListening();
        playingRef.current = false;
        setIsPlaying(false);
      });
      instance.bind(WIDGET_EVENT.error, () => {
        setEngineError(PLAYBACK_MESSAGE.trackFailed);
        setIsPlaying(false);
        flushListening();
      });
      instance.bind(WIDGET_EVENT.finish, () => {
        flushListening();
        anchor(0);
        advanceRef.current();
      });
    },
    [
      advanceRef,
      anchor,
      flushListening,
      interpolated,
      playingRef,
      remember,
      reportedMs,
      restoreVolume,
      rewindOnSwitch,
      setEngineError,
      setIsPlaying,
      setRecoveryNotice,
      setResumeNotice,
      syncHeldSound,
    ],
  );
}
