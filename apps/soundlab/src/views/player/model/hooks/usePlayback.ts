'use client';

import type { Track } from '@entities/track';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ScWidget,
  loadWidgetApi,
  mountEngineFrame,
  readSoundIds,
  setUrl,
  trackUrl,
  widgetSrc,
} from '../../api/widget';
import {
  PLAYBACK_MESSAGE,
  READY_TIMEOUT_MS,
  RESUME_TAIL_MS,
  REWIND_ATTEMPT_LIMIT,
  WIDGET_EVENT,
} from '../../config/playback';
import { MS_PER_SECOND } from '../../config/time';
import { type PendingRewind, hasLostRewind, isRewindWatched } from '../../lib/rewindGuard';
import { isValidPosition, validDuration } from '../../lib/widgetPayload';
import { REPEAT_MODE } from '../constants/repeatMode';
import { readStartTarget } from '../lastPlayed';
import { type PlaybackQueue, adjacentTrack, playableIds, resolveQueue } from '../queue';
import {
  currentIndexAtom,
  engineErrorAtom,
  engineModeAtom,
  frameState,
  isPlayingAtom,
  isReadyAtom,
  playbackQueueAtom,
  recoveryNoticeAtom,
  repeatModeAtom,
  resumeNoticeAtom,
  shuffleAtom,
  writeBuffered,
} from '../store/playback';
import { useLastPlayed } from './useLastPlayed';
import { useListeningLog } from './useListeningLog';
import { usePlaybackClock } from './usePlaybackClock';
import { useVolumeFade } from './useVolumeFade';

const PLAY_CURRENT = -1;

export type Playback = {
  startQueue: (queue: PlaybackQueue) => void;
  retry: () => void;
  playFrom: (ms: number) => void;
  select: (index: number) => void;
  toggle: () => void;
  step: (direction: 1 | -1) => void;
  seek: (ratio: number) => void;
  seekBy: (seconds: number) => void;
};

export function usePlayback(tracks: readonly Track[], initialTrackId?: number): Playback {
  const [index, setIndex] = useAtom(currentIndexAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const setIsReady = useSetAtom(isReadyAtom);
  const setEngineError = useSetAtom(engineErrorAtom);
  const setEngineMode = useSetAtom(engineModeAtom);
  const [queue, setQueue] = useAtom(playbackQueueAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);
  const setRecoveryNotice = useSetAtom(recoveryNoticeAtom);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const queueRef = useRef(queue);
  const listening = useListeningLog(queueRef);
  const flushListening = listening.flush;
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);

  const widget = useRef<ScWidget | null>(null);
  // api.js가 로드되면 widget.current는 곧바로 채워지지만, iframe이 ready를 보내기 전까지
  // 메서드 호출(postMessage)은 받는 쪽이 없어 그대로 사라진다 — 첫 클릭이 삼켜지는 창이다.
  const ready = useRef(false);
  const playing = useRef(false);
  const clock = usePlaybackClock(playing);
  const advance = useRef<() => void>(() => {});
  // 위젯이 지금 세트를 들고 있는가. 들고 있으면 전환이 skip으로 끝나 새 재생을 시작하지 않는다
  // — 백그라운드 자동 전환의 조건이다. 세트 밖 곡을 load하면 세트를 잃고 false가 된다.
  const holdsSet = useRef(false);
  // id를 아직 모르는 자리는 null로 남긴다 — 빼버리면 그 뒤가 한 칸씩 밀려 skip이 엉뚱한 곡으로 간다.
  const soundIds = useRef<(number | null)[]>([]);
  // 위젯이 지금 물고 있는 트랙. 딥링크로 들어오면 화면은 그 곡인데 위젯은 세트의 첫 곡을 물고 있어서
  // 그냥 play를 부르면 첫 곡이 난다 — 재개 전에 같은 곡인지 본다.
  const heldIndex = useRef(-1);
  // 다음 재생을 0에서 시작해야 하는가. 위젯은 세트 안 각 곡의 위치를 물고 있어서
  // 곡을 바꿔도 듣던 지점부터 난다 — 곡이 바뀔 때만 세우고 play 시점에 되감는다.
  // 일시정지 후 재생이나 스크럽 후 재생은 세우지 않으므로 그 위치를 지킨다.
  const shouldRewind = useRef(false);
  // play 직후 보낸 seekTo는 곧이어 위젯이 그 곡의 기억해 둔 위치로 덮어쓸 때가 있다(실측: 0을 한 번 보고한 뒤 ~20ms 만에 87초로).
  // 되감은 뒤 잠시 progress를 지켜보고, 기억된 위치로 튀면 다시 되감는다.
  const pendingRewind = useRef<PendingRewind | null>(null);
  const pauseAfterSwitch = useRef(false);
  const resume = useRef<{ index: number; ms: number } | null>(null);
  // 전환 요청의 세대. 위젯 콜백은 postMessage 왕복이라 빠른 연속 선택 시 낡은 응답이 늦게 도착한다
  // — 그대로 두면 나중에 온 이전 곡의 skip이 이겨서 "누른 곡이 아니라 아까 곡"이 난다.
  const goSeq = useRef(0);
  const queued = useRef<number | null>(null);
  const flushQueued = useRef<() => void>(() => {});
  const { playFaded, pauseFaded, restoreVolume, silence, stopFade } = useVolumeFade();
  const { remember, rememberIfDue } = useLastPlayed(tracks, heldIndex);
  const { anchor, report, settle, interpolated, reportedMs } = clock;
  const { track: trackListening, restart: restartListening } = listening;

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const onHide = () => {
      remember(reportedMs());
      flushListening();
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [flushListening, remember, reportedMs]);

  // 소리를 자동으로 내지는 않는다 — 브라우저가 제스처 없는 재생을 막는다. 첫 재생 조작에서 이어진다.
  useEffect(() => {
    const target = readStartTarget(initialTrackId);
    const at = target ? tracks.findIndex((track) => track.id === target.id) : -1;
    const track = tracks[at];
    if (!target || !track || track.isAvailable === false) return;
    setIndex(at);
    if (track.durationMs - target.ms < RESUME_TAIL_MS) return;
    resume.current = { index: at, ms: target.ms };
    setResumeNotice(target.ms);
    frameState.durationMs = track.durationMs;
    anchor(target.ms);
  }, [anchor, initialTrackId, setIndex, setResumeNotice, tracks]);

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
        widget.current = instance;

        instance.bind(WIDGET_EVENT.ready, () => {
          if (disposed) return;
          instance.getSounds((sounds) => {
            if (disposed) return;
            clearTimeout(readyTimer);
            setEngineError(null);
            soundIds.current = readSoundIds(sounds);
            holdsSet.current = soundIds.current.length > 1;
            setEngineMode(holdsSet.current ? 'set' : 'single');
            // soundIds가 채워진 뒤에 열어야 skip 경로가 올바른 위치를 찾는다.
            ready.current = true;
            setIsReady(true);
            flushQueued.current();
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
          if (shouldRewind.current) {
            shouldRewind.current = false;
            const at = resume.current?.ms ?? 0;
            resume.current = null;
            instance.seekTo(at);
            anchor(at);
            pendingRewind.current = { ms: at, since: performance.now(), attempts: 0 };
            if (pauseAfterSwitch.current) {
              pauseAfterSwitch.current = false;
              instance.pause();
              return;
            }
          }
          restoreVolume(instance);
          playing.current = true;
          setIsPlaying(true);
          setResumeNotice(null);
          setRecoveryNotice(false);
          setEngineError(null);
          if (holdsSet.current) {
            // 위젯이 스스로 다음 곡으로 넘어간 경우도 여기로 들어온다 — 목록 하이라이트를 여기서 맞춘다.
            instance.getCurrentSoundIndex((soundIndex) => {
              const id = soundIds.current[soundIndex];
              if (typeof id !== 'number') return;
              const next = tracks.findIndex((track) => track.id === id);
              if (next < 0) return;
              heldIndex.current = next;
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
          playing.current = false;
          setIsPlaying(false);
        });
        const isRewinding = (position: number) => {
          const pending = pendingRewind.current;
          if (!pending) return false;
          const now = performance.now();
          if (!isRewindWatched(pending, now) || pending.attempts >= REWIND_ATTEMPT_LIMIT) {
            pendingRewind.current = null;
            return false;
          }
          if (!hasLostRewind(pending, position, now)) return false;
          pendingRewind.current = { ms: pending.ms, since: now, attempts: pending.attempts + 1 };
          instance.seekTo(pending.ms);
          anchor(pending.ms);
          return true;
        };
        instance.bind(WIDGET_EVENT.progress, (payload) => {
          writeBuffered(payload.loadedProgress);
          if (!isValidPosition(payload.currentPosition)) return;
          if (isRewinding(payload.currentPosition)) return;
          trackListening(tracks[heldIndex.current]?.id ?? 0, payload.currentPosition, playing.current);
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
          advance.current();
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
      const owned = widget.current;
      widget.current = null;
      ready.current = false;
      heldIndex.current = -1;
      holdsSet.current = false;
      pendingRewind.current = null;
      soundIds.current = [];
      playing.current = false;
      pauseAfterSwitch.current = false;
      for (const event of Object.values(WIDGET_EVENT)) owned?.unbind(event);
      setIsReady(false);
      setIsPlaying(false);
      clearTimeout(readyTimer);
      stopFade();
      frame.remove();
    };
  }, [
    anchor,
    flushListening,
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
  ]);

  const goTo = useCallback(
    (next: number, track: Track) => {
      if (track.isAvailable === false) return;
      flushListening();
      restartListening(track.id);
      setEngineError(null);
      const instance = widget.current;
      if (!instance || !ready.current) {
        queued.current = next;
        return;
      }
      const seq = ++goSeq.current;
      const stale = () => goSeq.current !== seq || widget.current !== instance || !ready.current;
      anchor(0);
      shouldRewind.current = true;
      pendingRewind.current = null;
      pauseAfterSwitch.current = false;
      if (resume.current?.index !== next) resume.current = null;
      heldIndex.current = next;
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
        soundIds.current = readSoundIds(sounds);
        // 위젯 안의 위치로 변환한다. TRACKS 인덱스를 그대로 넘기면 다른 곡이 걸린다.
        const soundIndex = soundIds.current.indexOf(track.id);

        if (soundIndex >= 0 && holdsSet.current && !queueRef.current) {
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
              holdsSet.current = true;
              setEngineMode('set');
              instance.skip(soundIndex);
              readDuration();
            },
          });
          return;
        }

        holdsSet.current = false;
        setEngineMode('single');
        instance.load(trackUrl(track), {
          auto_play: true,
          show_artwork: false,
          show_comments: false,
          callback: readDuration,
        });
      });
    },
    [anchor, flushListening, restartListening, setEngineError, setEngineMode, silence, tracks],
  );

  // 곡을 바꾸는 도중에는 위젯이 새 곡을 곧 재생하므로, 지금 멈춰도 다시 튼다 — 새 곡이 시작되는 순간에 멈춘다
  const pause = useCallback(
    (instance: ScWidget) => {
      pauseAfterSwitch.current = shouldRewind.current;
      pauseFaded(instance);
    },
    [pauseFaded],
  );

  const start = useCallback(
    (instance: ScWidget) => {
      pauseAfterSwitch.current = false;
      const track = tracks[index];
      if (heldIndex.current === index || !track) {
        playFaded(instance);
        return;
      }
      goTo(index, track);
    },
    [goTo, index, playFaded, tracks],
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
        const instance = widget.current;
        if (!instance || !ready.current) {
          queued.current = next;
          return;
        }
        if (playing.current) pause(instance);
        else start(instance);
        return;
      }
      setIndex(next);
      goTo(next, track);
    },
    [flushListening, goTo, index, pause, setIndex, setQueue, setResumeNotice, start, tracks],
  );

  const toggle = useCallback(() => {
    if (tracks[index]?.isAvailable === false) return;
    const instance = widget.current;
    if (!instance || !ready.current) {
      queued.current = PLAY_CURRENT;
      return;
    }
    if (playing.current) pause(instance);
    else start(instance);
  }, [index, pause, start, tracks]);

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
      resume.current = null;
      setIndex(next);
      goTo(next, track);
    },
    [flushListening, goTo, setIndex, setQueue, setResumeNotice, tracks],
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

  const retry = useCallback(() => {
    const track = tracks[index];
    if (!track || track.isAvailable === false) return;
    resume.current = { index, ms: Math.max(0, reportedMs()) };
    heldIndex.current = -1;
    queued.current = index;
    ready.current = false;
    setEngineError(null);
    setRecoveryNotice(true);
    setRetryGeneration((generation) => generation + 1);
  }, [index, reportedMs, setEngineError, setRecoveryNotice, tracks]);

  const playFrom = useCallback(
    (ms: number) => {
      const track = tracks[index];
      if (!track || track.isAvailable === false || !Number.isFinite(ms)) return;
      const position = Math.min(track.durationMs - 1, Math.max(0, ms));
      const instance = widget.current;
      if (instance && ready.current && heldIndex.current === index) {
        pendingRewind.current = null;
        instance.seekTo(position);
        settle(position);
        frameState.position = position / track.durationMs;
        resume.current = null;
        setResumeNotice(null);
        pauseAfterSwitch.current = false;
        playFaded(instance);
        return;
      }
      resume.current = { index, ms: position };
      goTo(index, track);
    },
    [goTo, index, playFaded, setResumeNotice, settle, tracks],
  );

  useEffect(() => {
    flushQueued.current = () => {
      const target = queued.current;
      queued.current = null;
      if (target === null) return;
      const resolved = target === PLAY_CURRENT ? index : target;
      const track = tracks[resolved];
      if (track) goTo(resolved, track);
    };
  }, [goTo, index, tracks]);

  useEffect(() => {
    advance.current = () => {
      if (repeatMode === REPEAT_MODE.one) {
        widget.current?.seekTo(0);
        widget.current?.play();
        return;
      }

      // 세트 안이고 뒤에 곡이 더 남았으면 위젯이 스스로 넘긴다(play 이벤트로 인덱스가 동기화된다).
      // 새 재생을 시작하지 않는 경로라 백그라운드에서도 이어지므로, 여기서 가로채지 않는다.
      // 세트의 마지막 사운드였다면 위젯은 멈추므로 아래로 내려가 직접 넘긴다.
      const soundIndex = soundIds.current.indexOf(tracks[index]?.id ?? -1);
      const widgetAdvances =
        !queue && holdsSet.current && !shuffle && soundIndex >= 0 && soundIndex < soundIds.current.length - 1;
      if (widgetAdvances) {
        shouldRewind.current = true;
        return;
      }

      // step(1)은 목록 끝에서 첫 곡으로 되돌아간다. 반복이 꺼져 있으면 거기서 멈춰야 한다.
      const ids = queue ? resolveQueue(tracks, queue.ids) : playableIds(tracks);
      const isLastTrack = tracks[index]?.id === ids.at(-1);
      if (isLastTrack && repeatMode === REPEAT_MODE.off) {
        widget.current?.pause();
        setIsPlaying(false);
        return;
      }
      step(1);
    };
  }, [index, queue, repeatMode, setIsPlaying, shuffle, step, tracks]);

  const seek = useCallback(
    (ratio: number) => {
      if (!Number.isFinite(ratio)) return;
      const clamped = Math.min(1, Math.max(0, ratio));
      const ms = clamped * frameState.durationMs;
      pendingRewind.current = null;
      settle(ms);
      frameState.position = clamped;
      widget.current?.seekTo(ms);
    },
    [settle],
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

  return { select, toggle, step, seek, seekBy, startQueue, retry, playFrom };
}
