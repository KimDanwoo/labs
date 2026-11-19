'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import type { ScWidget } from '../../api/widget';
import { REPEAT_MODE } from '../constants/repeatMode';
import { type PlaybackQueue, adjacentTrack, playableIds, resolveQueue } from '../queue';
import {
  currentIndexAtom,
  isPlayingAtom,
  playbackQueueAtom,
  repeatModeAtom,
  resumeNoticeAtom,
  shuffleAtom,
} from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';
import type { GoTo } from './useTrackSwitch';

const PLAY_CURRENT = -1;

export function useTrackCommands({ tracks, refs, queueRef, listening, volume }: PlaybackEngine, goTo: GoTo) {
  const {
    widgetRef,
    readyRef,
    playingRef,
    advanceRef,
    holdsSetRef,
    soundIdsRef,
    heldIndexRef,
    shouldRewindRef,
    pauseAfterSwitchRef,
    resumeRef,
    queuedRef,
    flushQueuedRef,
  } = refs;
  const { flush: flushListening } = listening;
  const { playFaded, pauseFaded } = volume;
  const [index, setIndex] = useAtom(currentIndexAtom);
  const [queue, setQueue] = useAtom(playbackQueueAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);

  // 곡을 바꾸는 도중에는 위젯이 새 곡을 곧 재생하므로, 지금 멈춰도 다시 튼다 — 새 곡이 시작되는 순간에 멈춘다
  const pause = useCallback(
    (instance: ScWidget) => {
      pauseAfterSwitchRef.current = shouldRewindRef.current;
      pauseFaded(instance);
    },
    [pauseAfterSwitchRef, pauseFaded, shouldRewindRef],
  );

  const start = useCallback(
    (instance: ScWidget) => {
      pauseAfterSwitchRef.current = false;
      const track = tracks[index];
      if (heldIndexRef.current === index || !track) {
        playFaded(instance);
        return;
      }
      goTo(index, track);
    },
    [goTo, heldIndexRef, index, pauseAfterSwitchRef, playFaded, tracks],
  );

  const select = useCallback(
    (next: number) => {
      const track = tracks[next];
      if (!track || track.isAvailable === false) return;
      if (queueRef.current && !queueRef.current.ids.includes(track.id)) {
        flushListening();
        queueRef.current = null;
        setQueue(null);
      }
      setResumeNotice(null);
      if (next === index) {
        const instance = widgetRef.current;
        if (!instance || !readyRef.current) {
          queuedRef.current = next;
          return;
        }
        if (playingRef.current) pause(instance);
        else start(instance);
        return;
      }
      setIndex(next);
      goTo(next, track);
    },
    [
      flushListening,
      goTo,
      index,
      pause,
      playingRef,
      queueRef,
      queuedRef,
      readyRef,
      setIndex,
      setQueue,
      setResumeNotice,
      start,
      tracks,
      widgetRef,
    ],
  );

  const toggle = useCallback(() => {
    if (tracks[index]?.isAvailable === false) return;
    const instance = widgetRef.current;
    if (!instance || !readyRef.current) {
      queuedRef.current = PLAY_CURRENT;
      return;
    }
    if (playingRef.current) pause(instance);
    else start(instance);
  }, [index, pause, playingRef, queuedRef, readyRef, start, tracks, widgetRef]);

  const startQueue = useCallback(
    (requested: PlaybackQueue) => {
      const ids = resolveQueue(tracks, requested.ids);
      const next = tracks.findIndex((track) => track.id === ids[0]);
      const track = tracks[next];
      if (!track) return;
      flushListening();
      const nextQueue = { ids, label: requested.label };
      queueRef.current = nextQueue;
      setQueue(nextQueue);
      setResumeNotice(null);
      resumeRef.current = null;
      setIndex(next);
      goTo(next, track);
    },
    [flushListening, goTo, queueRef, resumeRef, setIndex, setQueue, setResumeNotice, tracks],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      const ids = queue ? resolveQueue(tracks, queue.ids) : playableIds(tracks);
      const id = adjacentTrack({
        ids,
        currentId: tracks[index]?.id ?? -1,
        direction,
        random: shuffle && direction === 1 ? Math.random() : undefined,
      });
      const next = tracks.findIndex((track) => track.id === id);
      const track = tracks[next];
      if (!track) return;
      setIndex(next);
      goTo(next, track);
    },
    [goTo, index, queue, setIndex, shuffle, tracks],
  );

  useEffect(() => {
    flushQueuedRef.current = () => {
      const target = queuedRef.current;
      queuedRef.current = null;
      if (target === null) return;
      const resolved = target === PLAY_CURRENT ? index : target;
      const track = tracks[resolved];
      if (track) goTo(resolved, track);
    };
  }, [flushQueuedRef, goTo, index, queuedRef, tracks]);

  useEffect(() => {
    advanceRef.current = () => {
      if (repeatMode === REPEAT_MODE.one) {
        widgetRef.current?.seekTo(0);
        widgetRef.current?.play();
        return;
      }

      // 세트 안이고 뒤에 곡이 더 남았으면 위젯이 스스로 넘긴다(play 이벤트로 인덱스가 동기화된다).
      // 새 재생을 시작하지 않는 경로라 백그라운드에서도 이어지므로, 여기서 가로채지 않는다.
      // 세트의 마지막 사운드였다면 위젯은 멈추므로 아래로 내려가 직접 넘긴다.
      const soundIndex = soundIdsRef.current.indexOf(tracks[index]?.id ?? -1);
      const widgetAdvances =
        !queue && holdsSetRef.current && !shuffle && soundIndex >= 0 && soundIndex < soundIdsRef.current.length - 1;
      if (widgetAdvances) {
        shouldRewindRef.current = true;
        return;
      }

      // step(1)은 목록 끝에서 첫 곡으로 되돌아간다. 반복이 꺼져 있으면 거기서 멈춰야 한다.
      const ids = queue ? resolveQueue(tracks, queue.ids) : playableIds(tracks);
      const isLastTrack = tracks[index]?.id === ids.at(-1);
      if (isLastTrack && repeatMode === REPEAT_MODE.off) {
        widgetRef.current?.pause();
        setIsPlaying(false);
        return;
      }
      step(1);
    };
  }, [
    advanceRef,
    holdsSetRef,
    index,
    queue,
    repeatMode,
    setIsPlaying,
    shouldRewindRef,
    shuffle,
    soundIdsRef,
    step,
    tracks,
    widgetRef,
  ]);

  return { select, toggle, step, startQueue };
}
