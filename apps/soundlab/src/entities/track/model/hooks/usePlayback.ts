'use client';

import { useFrame } from '@shared/lib/frame';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ScWidget,
  loadWidgetApi,
  mountEngineFrame,
  readStartTarget,
  setUrl,
  soundId,
  trackUrl,
  widgetSrc,
  writeLastPlayed,
} from '../../api/widget';
import { type PositionReport, advanceClock, estimatePosition } from '../../lib/playbackClock';
import { REPEAT_MODE } from '../constants/repeatMode';
import { LISTEN_SOURCE, recordListeningAtom, recordSessionAtom, SESSION_EVENT } from '../library';
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
} from '../store/playback';
import type { Track } from '../types/track';
import { useVolumeFade } from './useVolumeFade';

/** 위젯 콜백은 undefined를 줄 수 있다. 비유한값이 frameState로 새면 시간 표시가 NaN이 된다. */
const validDuration = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

const PLAY_CURRENT = -1;

/** 위젯이 준 사운드 목록을 위치 그대로 id 배열로 옮긴다. 자리를 지우지 않는 게 핵심이다. */
const readSoundIds = (sounds: unknown[]) => (Array.isArray(sounds) ? sounds.map(soundId) : []);

const EVENTS = {
  ready: 'ready',
  play: 'play',
  pause: 'pause',
  finish: 'finish',
  progress: 'playProgress',
  buffer: 'loadProgress',
  error: 'error',
} as const;

/** ready가 이 안에 안 오면 엔진이 막힌 것으로 본다 — w.soundcloud.com은 광고 차단기가 흔히 막는다. */
const READY_TIMEOUT_MS = 10_000;
const ENGINE_BLOCKED_MESSAGE =
  '재생 엔진이 응답하지 않습니다. 광고 차단기가 soundcloud.com을 막고 있는지 확인해 주세요.';
const TRACK_FAILED_MESSAGE = '곡을 재생할 수 없습니다. 잠시 후 다시 시도해 주세요.';

const MS_PER_SECOND = 1000;

const isValidPosition = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const writeBuffered = (loaded: number | undefined) => {
  if (typeof loaded === 'number' && Number.isFinite(loaded)) frameState.buffered = Math.min(1, Math.max(0, loaded));
};

const SAVE_INTERVAL_MS = 5000;
const RESUME_TAIL_MS = 5000;

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
  const recordListening = useSetAtom(recordListeningAtom);
  const recordSession = useSetAtom(recordSessionAtom);
  const sessionTracks = useRef(new Set<number>());
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = performance.now();
  }, []);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const queueRef = useRef(queue);
  const listening = useRef({ id: 0, ms: 0, position: 0, at: 0 });
  const flushListening = useCallback(() => {
    const pending = listening.current;
    if (pending.ms > 0)
      recordListening({
        id: pending.id,
        elapsedMs: pending.ms,
        source: queueRef.current ? LISTEN_SOURCE.collection : LISTEN_SOURCE.all,
      });
    pending.ms = 0;
  }, [recordListening]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);

  const widget = useRef<ScWidget | null>(null);
  // api.js가 로드되면 widget.current는 곧바로 채워지지만, iframe이 ready를 보내기 전까지
  // 메서드 호출(postMessage)은 받는 쪽이 없어 그대로 사라진다 — 첫 클릭이 삼켜지는 창이다.
  const ready = useRef(false);
  // PLAY_PROGRESS는 수백 ms 간격이라 60fps에 부족하다. 마지막 보고값과 시각을 남겨 rAF에서 보간한다.
  // live = 그 보고가 "지금 흐르는 소리"의 것인가. play 이벤트는 버퍼링 전에 오므로
  // 첫 보고를 받기 전까지 보간을 세워둔다 — 안 세우면 소리 없이 시간이 흐르다 0으로 되돌아간다.
  const reported = useRef<PositionReport>({ ms: 0, at: 0, live: false });
  const smoothMs = useRef(0);
  const playing = useRef(false);
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
  const resume = useRef<{ index: number; ms: number } | null>(null);
  const savedAt = useRef(0);
  // 전환 요청의 세대. 위젯 콜백은 postMessage 왕복이라 빠른 연속 선택 시 낡은 응답이 늦게 도착한다
  // — 그대로 두면 나중에 온 이전 곡의 skip이 이겨서 "누른 곡이 아니라 아까 곡"이 난다.
  const goSeq = useRef(0);
  const queued = useRef<number | null>(null);
  const flushQueued = useRef<() => void>(() => {});
  const { playFaded, pauseFaded, restoreVolume, silence, stopFade } = useVolumeFade();

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

  const remember = useCallback(
    (ms: number) => {
      const track = tracks[heldIndex.current];
      if (!track || !Number.isFinite(ms)) return;
      savedAt.current = performance.now();
      writeLastPlayed({ id: track.id, ms: Math.round(Math.max(0, ms)) });
    },
    [tracks],
  );

  useEffect(() => {
    const onHide = () => {
      remember(reported.current.ms);
      flushListening();
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [flushListening, remember]);

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
    reported.current = { ms: target.ms, at: performance.now(), live: false };
  }, [initialTrackId, setIndex, setResumeNotice, tracks]);

  useEffect(() => {
    let disposed = false;
    const first = tracks[0];
    const frame = mountEngineFrame(widgetSrc(setUrl(tracks) ?? (first ? trackUrl(first) : '')));

    const readyTimer = setTimeout(() => {
      setEngineError(ENGINE_BLOCKED_MESSAGE);
      setIsReady(false);
    }, READY_TIMEOUT_MS);

    loadWidgetApi()
      .then((sc) => {
        if (disposed) return;
        const instance = sc.Widget(frame);
        widget.current = instance;

        instance.bind(EVENTS.ready, () => {
          if (disposed) return;
          clearTimeout(readyTimer);
          setEngineError(null);
          instance.getSounds((sounds) => {
            if (disposed) return;
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
        const anchor = (ms: number) => {
          reported.current = { ms, at: performance.now(), live: false };
        };
        const interpolated = () => estimatePosition(reported.current, playing.current, performance.now());

        instance.bind(EVENTS.play, () => {
          anchor(interpolated());
          // 볼륨이 아직 0인 지금 되감아야 이전 위치가 소리로 새지 않는다.
          if (shouldRewind.current) {
            shouldRewind.current = false;
            const at = resume.current?.ms ?? 0;
            resume.current = null;
            instance.seekTo(at);
            anchor(at);
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
        instance.bind(EVENTS.pause, () => {
          // 마지막 보고는 최대 수백 ms 낡았다. 보간해온 값으로 고정해야 멈춘 순간 시간이 뒤로 안 튄다.
          anchor(interpolated());
          remember(reported.current.ms);
          flushListening();
          playing.current = false;
          setIsPlaying(false);
        });
        instance.bind(EVENTS.progress, (payload) => {
          writeBuffered(payload.loadedProgress);
          if (!isValidPosition(payload.currentPosition)) return;
          const pending = listening.current;
          const currentId = tracks[heldIndex.current]?.id ?? 0;
          const now = performance.now();
          if (
            playing.current &&
            currentId > 0 &&
            payload.currentPosition > 0 &&
            !sessionTracks.current.has(currentId)
          ) {
            if (sessionTracks.current.size < 2)
              recordSession({
                kind: sessionTracks.current.size === 0 ? SESSION_EVENT.firstPlay : SESSION_EVENT.continued,
                waitMs: now - openedAt.current,
              });
            sessionTracks.current.add(currentId);
          }
          const elapsed = payload.currentPosition - pending.position;
          const wall = now - pending.at;
          if (pending.id === currentId && elapsed > 0 && elapsed < 5000 && wall > 0 && wall < 5000) {
            pending.ms += Math.min(elapsed, wall);
          }
          pending.id = currentId;
          pending.position = payload.currentPosition;
          pending.at = now;
          if (pending.ms >= SAVE_INTERVAL_MS) flushListening();
          reported.current = { ms: payload.currentPosition, at: performance.now(), live: true };
          if (performance.now() - savedAt.current >= SAVE_INTERVAL_MS) remember(payload.currentPosition);
        });
        instance.bind(EVENTS.buffer, (payload) => writeBuffered(payload.loadedProgress));
        instance.bind(EVENTS.error, () => {
          setEngineError(TRACK_FAILED_MESSAGE);
          setIsPlaying(false);
          flushListening();
        });
        instance.bind(EVENTS.finish, () => {
          // 다음 곡(또는 반복)은 0부터다. 끝난 위치를 물고 있으면 그 곡의 첫 순간이 끝 시간으로 보인다.
          flushListening();
          anchor(0);
          advance.current();
        });
      })
      .catch(() => {
        if (disposed) return;
        clearTimeout(readyTimer);
        setEngineError('재생 엔진을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
      });

    return () => {
      disposed = true;
      flushListening();
      const owned = widget.current;
      widget.current = null;
      ready.current = false;
      heldIndex.current = -1;
      holdsSet.current = false;
      soundIds.current = [];
      playing.current = false;
      goSeq.current++;
      for (const event of Object.values(EVENTS)) owned?.unbind(event);
      setIsReady(false);
      setIsPlaying(false);
      clearTimeout(readyTimer);
      stopFade();
      frame.remove();
    };
  }, [
    flushListening,
    remember,
    recordSession,
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
    tracks,
  ]);

  const goTo = useCallback(
    (next: number, track: Track) => {
      if (track.isAvailable === false) return;
      flushListening();
      listening.current = { id: track.id, ms: 0, position: 0, at: 0 };
      setEngineError(null);
      const instance = widget.current;
      if (!instance || !ready.current) {
        queued.current = next;
        return;
      }
      const seq = ++goSeq.current;
      const stale = () => goSeq.current !== seq || widget.current !== instance || !ready.current;
      reported.current = { ms: 0, at: performance.now(), live: false };
      shouldRewind.current = true;
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
    [flushListening, setEngineError, setEngineMode, silence, tracks],
  );

  const start = useCallback(
    (instance: ScWidget) => {
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
        if (playing.current) pauseFaded(instance);
        else start(instance);
        return;
      }
      setIndex(next);
      goTo(next, track);
    },
    [flushListening, goTo, index, pauseFaded, setIndex, setQueue, setResumeNotice, start, tracks],
  );

  const toggle = useCallback(() => {
    if (tracks[index]?.isAvailable === false) return;
    const instance = widget.current;
    if (!instance || !ready.current) {
      queued.current = PLAY_CURRENT;
      return;
    }
    if (playing.current) pauseFaded(instance);
    else start(instance);
  }, [index, pauseFaded, start, tracks]);

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
    resume.current = { index, ms: Math.max(0, reported.current.ms) };
    heldIndex.current = -1;
    queued.current = index;
    ready.current = false;
    setEngineError(null);
    setRecoveryNotice(true);
    setRetryGeneration((generation) => generation + 1);
  }, [index, setEngineError, setRecoveryNotice, tracks]);

  const playFrom = useCallback(
    (ms: number) => {
      const track = tracks[index];
      if (!track || track.isAvailable === false || !Number.isFinite(ms)) return;
      const position = Math.min(track.durationMs - 1, Math.max(0, ms));
      const instance = widget.current;
      if (instance && ready.current && heldIndex.current === index) {
        instance.seekTo(position);
        reported.current = { ms: position, at: performance.now(), live: true };
        smoothMs.current = position;
        frameState.position = position / track.durationMs;
        resume.current = null;
        setResumeNotice(null);
        playFaded(instance);
        return;
      }
      resume.current = { index, ms: position };
      goTo(index, track);
    },
    [goTo, index, playFaded, setResumeNotice, tracks],
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

  const seek = useCallback((ratio: number) => {
    if (!Number.isFinite(ratio)) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    const ms = clamped * frameState.durationMs;
    reported.current = { ms, at: performance.now(), live: true };
    smoothMs.current = ms;
    frameState.position = clamped;
    widget.current?.seekTo(ms);
  }, []);

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

  useFrame((delta) => {
    const { durationMs } = frameState;
    if (!Number.isFinite(durationMs) || durationMs <= 0) return;
    smoothMs.current = advanceClock({
      smoothMs: smoothMs.current,
      delta,
      report: reported.current,
      isPlaying: playing.current,
      now: performance.now(),
    });
    frameState.position = Math.min(1, smoothMs.current / durationMs);
  });

  return { select, toggle, step, seek, seekBy, startQueue, retry, playFrom };
}
