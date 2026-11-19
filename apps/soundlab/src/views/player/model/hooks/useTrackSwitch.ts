'use client';

import type { Track } from '@entities/track';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { readSoundIds, setUrl, trackUrl } from '../../api/widget';
import { validDuration } from '../../lib/widgetPayload';
import { engineErrorAtom, engineModeAtom, frameState } from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';

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
      if (!instance || !readyRef.current) {
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

      // 목록은 ready 시점의 것이 끝이 아니다 — 위젯이 프로필 곡을 나눠 싣는다(실측 20개 → 25개).
      // 전환할 때마다 다시 읽어야 위치가 맞는다. 우리 목록에 없는 사운드(최근 업로드)가 섞여 있어도 마찬가지다.
      instance.getSounds((sounds) => {
        if (stale()) return;
        soundIdsRef.current = readSoundIds(sounds);
        // 위젯 안의 위치로 변환한다. TRACKS 인덱스를 그대로 넘기면 다른 곡이 걸린다.
        const soundIndex = soundIdsRef.current.indexOf(track.id);

        if (soundIndex >= 0 && holdsSetRef.current && !queueRef.current) {
          // 이미 재생 중인 플레이어 안에서 옮겨간다 — 새 재생을 시작하지 않는 게 핵심이다.
          // 단, 위젯이 이미 그 사운드를 들고 있으면 skip은 아무 일도 하지 않는다(멈춰 있으면 계속 멈춘 채다).
          instance.getCurrentSoundIndex((current) => {
            if (stale()) return;
            if (current === soundIndex) instance.play();
            else instance.skip(soundIndex);
          });
          return;
        }

        // 세트 밖 곡을 틀면 위젯이 세트를 잃는다.
        // 다시 세트 안 곡으로 돌아올 땐 세트를 복구해야 skip과 백그라운드 전환이 살아난다.
        const target = soundIndex >= 0 && !queueRef.current ? setUrl(tracks) : null;
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
