'use client';

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import type { ScWidget } from '../../api/widget';
import { PLAYBACK_MESSAGE, WIDGET_EVENT } from '../../config/playback';
import { validDuration } from '../../lib/widgetPayload';
import {
  currentIndexAtom,
  engineErrorAtom,
  frameState,
  isPlayingAtom,
  recoveryNoticeAtom,
  resumeNoticeAtom,
} from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';

export function usePlaybackEvents({ tracks, refs, clock, listening, volume, lastPlayed }: PlaybackEngine) {
  const {
    playingRef,
    advanceRef,
    holdsSetRef,
    soundIdsRef,
    heldIndexRef,
    shouldRewindRef,
    pendingRewindRef,
    pauseAfterSwitchRef,
    resumeRef,
  } = refs;
  const { anchor, interpolated, reportedMs } = clock;
  const { flush: flushListening } = listening;
  const { restoreVolume } = volume;
  const { remember } = lastPlayed;
  const setIndex = useSetAtom(currentIndexAtom);
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
        if (shouldRewindRef.current) {
          shouldRewindRef.current = false;
          const at = resumeRef.current?.ms ?? 0;
          resumeRef.current = null;
          instance.seekTo(at);
          anchor(at);
          pendingRewindRef.current = { ms: at, since: performance.now(), attempts: 0 };
          if (pauseAfterSwitchRef.current) {
            pauseAfterSwitchRef.current = false;
            instance.pause();
            return;
          }
        }
        restoreVolume(instance);
        playingRef.current = true;
        setIsPlaying(true);
        setResumeNotice(null);
        setRecoveryNotice(false);
        setEngineError(null);
        if (holdsSetRef.current) {
          // 위젯이 스스로 다음 곡으로 넘어간 경우도 여기로 들어온다 — 목록 하이라이트를 여기서 맞춘다.
          instance.getCurrentSoundIndex((soundIndex) => {
            const id = soundIdsRef.current[soundIndex];
            if (typeof id !== 'number') return;
            const next = tracks.findIndex((track) => track.id === id);
            if (next < 0) return;
            heldIndexRef.current = next;
            setIndex(next);
          });
          instance.getDuration((ms) => {
            if (isDisposed()) return;
            frameState.durationMs = validDuration(ms, frameState.durationMs);
          });
        }
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
      heldIndexRef,
      holdsSetRef,
      interpolated,
      pauseAfterSwitchRef,
      pendingRewindRef,
      playingRef,
      remember,
      reportedMs,
      restoreVolume,
      resumeRef,
      setEngineError,
      setIndex,
      setIsPlaying,
      setRecoveryNotice,
      setResumeNotice,
      shouldRewindRef,
      soundIdsRef,
      tracks,
    ],
  );
}
