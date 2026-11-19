'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { loadWidgetApi, mountEngineFrame, readSoundIds, setUrl, trackUrl, widgetSrc } from '../../api/widget';
import { PLAYBACK_MESSAGE, READY_TIMEOUT_MS, REWIND_ATTEMPT_LIMIT, WIDGET_EVENT } from '../../config/playback';
import { hasLostRewind, isRewindWatched } from '../../lib/rewindGuard';
import { isValidPosition, validDuration } from '../../lib/widgetPayload';
import {
  currentIndexAtom,
  engineErrorAtom,
  engineModeAtom,
  frameState,
  isPlayingAtom,
  isReadyAtom,
  recoveryNoticeAtom,
  resumeNoticeAtom,
  writeBuffered,
} from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';

export function useWidgetEngine(engine: PlaybackEngine, retryGeneration: number) {
  const { tracks, refs, clock, listening, volume, lastPlayed } = engine;
  const {
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
    flushQueuedRef,
  } = refs;
  const { anchor, report, interpolated, reportedMs } = clock;
  const { flush: flushListening, track: trackListening } = listening;
  const { restoreVolume, stopFade } = volume;
  const { remember, rememberIfDue } = lastPlayed;
  const setIndex = useSetAtom(currentIndexAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setIsReady = useSetAtom(isReadyAtom);
  const setEngineError = useSetAtom(engineErrorAtom);
  const setEngineMode = useSetAtom(engineModeAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);
  const setRecoveryNotice = useSetAtom(recoveryNoticeAtom);

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
              if (disposed) return;
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
        const isRewinding = (position: number) => {
          const pending = pendingRewindRef.current;
          if (!pending) return false;
          const now = performance.now();
          if (!isRewindWatched(pending, now) || pending.attempts >= REWIND_ATTEMPT_LIMIT) {
            pendingRewindRef.current = null;
            return false;
          }
          if (!hasLostRewind(pending, position, now)) return false;
          pendingRewindRef.current = { ms: pending.ms, since: now, attempts: pending.attempts + 1 };
          instance.seekTo(pending.ms);
          anchor(pending.ms);
          return true;
        };
        instance.bind(WIDGET_EVENT.progress, (payload) => {
          writeBuffered(payload.loadedProgress);
          if (!isValidPosition(payload.currentPosition)) return;
          if (isRewinding(payload.currentPosition)) return;
          trackListening(tracks[heldIndexRef.current]?.id ?? 0, payload.currentPosition, playingRef.current);
          report(payload.currentPosition);
          rememberIfDue(payload.currentPosition);
        });
        instance.bind(WIDGET_EVENT.buffer, (payload) => writeBuffered(payload.loadedProgress));
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
    advanceRef,
    anchor,
    flushListening,
    flushQueuedRef,
    heldIndexRef,
    holdsSetRef,
    interpolated,
    remember,
    rememberIfDue,
    report,
    reportedMs,
    restoreVolume,
    retryGeneration,
    setEngineError,
    setEngineMode,
    setIndex,
    setIsPlaying,
    setIsReady,
    setResumeNotice,
    setRecoveryNotice,
    stopFade,
    trackListening,
    tracks,
    widgetRef,
    soundIdsRef,
    readyRef,
    shouldRewindRef,
    playingRef,
    resumeRef,
    pendingRewindRef,
    pauseAfterSwitchRef,
  ]);
}
