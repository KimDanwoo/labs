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
      // 보간을 지금 값에 못 박고 세운다. 일시정지 중 흐른 벽시계 시간이 재생 순간 점프로 새지 않게.
      instance.bind(WIDGET_EVENT.play, () => {
        anchor(interpolated());
        // 볼륨이 아직 0인 지금 되감아야 이전 위치가 소리로 새지 않는다.
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
        // 마지막 보고는 최대 수백 ms 낡았다. 보간해온 값으로 고정해야 멈춘 순간 시간이 뒤로 안 튄다.
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
        // 다음 곡(또는 반복)은 0부터다. 끝난 위치를 물고 있으면 그 곡의 첫 순간이 끝 시간으로 보인다.
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
