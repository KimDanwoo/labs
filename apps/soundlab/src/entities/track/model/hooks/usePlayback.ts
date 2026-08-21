'use client';

import { useFrame } from '@shared/lib/frame';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { REPEAT_MODE } from '../constants/repeatMode';
import {
  loadWidgetApi,
  readLastPlayed,
  readSharedStartMs,
  setUrl,
  soundId,
  trackUrl,
  widgetSrc,
  writeLastPlayed,
  type ScWidget,
} from '../services';
import {
  currentIndexAtom,
  engineErrorAtom,
  engineModeAtom,
  frameState,
  isPlayingAtom,
  isReadyAtom,
  repeatModeAtom,
  shuffleAtom,
} from '../store';
import type { Track } from '../types';

/** 위젯 콜백은 undefined를 줄 수 있다. 비유한값이 frameState로 새면 시간 표시가 NaN이 된다. */
const validDuration = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

/** 준비 전에 눌린 재생 요청. toggle은 의존성 없이 만들어져 인덱스를 모르므로 소진 시점에 해석한다. */
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

/** 페이드 길이와 스텝. setVolume은 postMessage라 프레임마다 보내지 않는다. */
const FADE_MS = 220;
const FADE_STEP_MS = 20;
const FULL_VOLUME = 100;

/** 이어 듣기 기록. 자주 쓰면 낭비, 드물게 쓰면 마지막 몇 초를 잃는다. */
const SAVE_INTERVAL_MS = 5000;
/** 끝자락에서 나갔다면 이어 들을 게 없다 — 처음부터 틀어준다. */
const RESUME_TAIL_MS = 5000;

export type Playback = {
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
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);

  const widget = useRef<ScWidget | null>(null);
  // PLAY_PROGRESS는 수백 ms 간격이라 60fps에 부족하다. 마지막 보고값과 시각을 남겨 rAF에서 보간한다.
  // live = 그 보고가 "지금 흐르는 소리"의 것인가. play 이벤트는 버퍼링 전에 오므로
  // 첫 보고를 받기 전까지 보간을 세워둔다 — 안 세우면 소리 없이 시간이 흐르다 0으로 되돌아간다.
  const reported = useRef({ ms: 0, at: 0, live: false });
  const playing = useRef(false);
  const advance = useRef<() => void>(() => {});
  // 위젯이 지금 세트를 들고 있는가. 들고 있으면 전환이 skip으로 끝나 새 재생을 시작하지 않는다
  // — 백그라운드 자동 전환의 조건이다. 세트 밖 곡을 load하면 세트를 잃고 false가 된다.
  const holdsSet = useRef(false);
  // 세트에 실린 곡 순서(위치 → 트랙 id). skip 대상과 현재 곡 하이라이트를 위치가 아니라 id로 맞춘다.
  // id를 아직 모르는 자리는 null로 남긴다 — 빼버리면 그 뒤가 한 칸씩 밀려 skip이 엉뚱한 곡으로 간다.
  const soundIds = useRef<(number | null)[]>([]);
  // 위젯이 지금 물고 있는 트랙. 딥링크로 들어오면 화면은 그 곡인데 위젯은 세트의 첫 곡을 물고 있어서
  // 그냥 play를 부르면 첫 곡이 난다 — 재개 전에 같은 곡인지 본다.
  const heldIndex = useRef(-1);
  // 다음 재생을 0에서 시작해야 하는가. 위젯은 세트 안 각 곡의 위치를 물고 있어서
  // 곡을 바꿔도 듣던 지점부터 난다 — 곡이 바뀔 때만 세우고 play 시점에 되감는다.
  // 일시정지 후 재생이나 스크럽 후 재생은 세우지 않으므로 그 위치를 지킨다.
  const shouldRewind = useRef(false);
  // 지난 방문에서 듣던 자리. 그 곡을 시작할 때 한 번만 쓰고 비운다(다른 곡을 고르면 버린다).
  const resume = useRef<{ index: number; ms: number } | null>(null);
  const savedAt = useRef(0);
  // 위젯이 준비되기 전에 누른 곡. 버리면 제목·하이라이트만 바뀌고 소리는 영원히 안 나서
  // "눌렀는데 재생이 안 된다"가 된다(엔진 로드가 늦을수록 잘 걸린다). ready에서 소진한다.
  const queued = useRef<number | null>(null);
  const flushQueued = useRef<() => void>(() => {});
  // 위젯은 볼륨 램프를 안 해준다. 안 감싸면 재생이 툭 시작하고 정지가 툭 끊긴다.
  const volume = useRef(FULL_VOLUME);
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 현재 볼륨에서 target까지 민다. 진행 중인 페이드는 지금 값에서 이어받아 튀지 않는다. */
  const rampTo = useCallback((instance: ScWidget, target: number, done?: () => void) => {
    if (fade.current !== null) clearInterval(fade.current);
    const from = volume.current;
    if (from === target) {
      done?.();
      return;
    }
    const started = performance.now();
    const handle = setInterval(() => {
      const ratio = Math.min(1, (performance.now() - started) / FADE_MS);
      volume.current = from + (target - from) * ratio;
      instance.setVolume(volume.current);
      if (ratio < 1) return;
      clearInterval(handle);
      if (fade.current === handle) fade.current = null;
      done?.();
    }, FADE_STEP_MS);
    fade.current = handle;
  }, []);

  const playFaded = useCallback(
    (instance: ScWidget) => {
      instance.play();
      rampTo(instance, FULL_VOLUME);
    },
    [rampTo],
  );

  const pauseFaded = useCallback(
    (instance: ScWidget) => {
      // 볼륨은 0으로 남긴다. 다음 재생은 play 이벤트가 다시 올려준다.
      rampTo(instance, 0, () => instance.pause());
    },
    [rampTo],
  );

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

  /** 듣던 자리를 남긴다. 아직 아무것도 걸지 않았으면(heldIndex -1) 지난 기록을 지우지 않는다. */
  const remember = useCallback(
    (ms: number) => {
      const track = tracks[heldIndex.current];
      if (!track || !Number.isFinite(ms)) return;
      savedAt.current = performance.now();
      writeLastPlayed({ id: track.id, ms: Math.round(Math.max(0, ms)) });
    },
    [tracks],
  );

  // 탭을 닫거나 백그라운드로 보낼 때. 5초 주기 저장이 놓친 마지막 구간을 메운다.
  useEffect(() => {
    const onHide = () => remember(reported.current.ms);
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [remember]);

  // 어디서부터 들을 것인가. 주소가 곡을 지목했으면(공유 링크) 그 링크의 ?t가, 아니면 지난 방문 기록이 정한다.
  // 소리를 자동으로 내지는 않는다 — 브라우저가 제스처 없는 재생을 막는다. 첫 재생 조작에서 이어진다.
  useEffect(() => {
    const shared = () => {
      const ms = readSharedStartMs(window.location.search);
      const at = tracks.findIndex((track) => track.id === initialTrackId);
      return ms === null || at < 0 ? null : { index: at, ms };
    };
    const remembered = () => {
      const last = readLastPlayed();
      if (!last) return null;
      const at = tracks.findIndex((track) => track.id === last.id);
      return at < 0 ? null : { index: at, ms: last.ms };
    };

    const point = initialTrackId !== undefined ? shared() : remembered();
    const track = point && tracks[point.index];
    if (!point || !track) return;
    setIndex(point.index);
    if (track.durationMs - point.ms < RESUME_TAIL_MS) return;
    resume.current = point;
    frameState.durationMs = track.durationMs;
    reported.current = { ms: point.ms, at: performance.now(), live: false };
    // 진입 시 한 번만. tracks·setIndex는 앱 수명 동안 안 바뀐다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let disposed = false;
    const frame = document.createElement('iframe');
    // display:none은 일부 엔진에서 미디어 재생을 막는다. 1×1 투명으로 둔다.
    frame.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
    frame.allow = 'autoplay';
    frame.setAttribute('aria-hidden', 'true');
    frame.title = 'SoundCloud 재생 엔진';
    // 곡 전체를 한 번에 올려본다. 받아들여지면 전환이 skip으로 끝난다.
    const first = tracks[0];
    frame.src = widgetSrc(setUrl(tracks) ?? (first ? trackUrl(first) : ''));
    document.body.append(frame);

    loadWidgetApi()
      .then((sc) => {
        if (disposed) return;
        const instance = sc.Widget(frame);
        widget.current = instance;

        instance.bind(EVENTS.ready, () => {
          // 세트 URL이 실제로 먹혔는지 런타임에 확인한다. 곡 수는 위젯이 정하므로 일치를 요구하지 않는다.
          instance.getSounds((sounds) => {
            soundIds.current = readSoundIds(sounds);
            holdsSet.current = soundIds.current.length > 1;
            setEngineMode(holdsSet.current ? 'set' : 'single');
            // soundIds가 채워진 뒤에 소진해야 skip 경로가 올바른 위치를 찾는다.
            flushQueued.current();
          });
          instance.getDuration((ms) => {
            frameState.durationMs = validDuration(ms, frameState.durationMs);
          });
          setIsReady(true);
        });
        // 보간을 지금 값에 못 박고 세운다. 일시정지 중 흐른 벽시계 시간이 재생 순간 점프로 새지 않게.
        const anchor = (ms: number) => {
          reported.current = { ms, at: performance.now(), live: false };
        };
        const interpolated = () => {
          const { ms, at, live } = reported.current;
          return live && playing.current ? ms + (performance.now() - at) : ms;
        };

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
          // 어느 경로로 시작했든(토글·곡 전환·위젯 자체 전환) 여기서 볼륨을 되올린다.
          rampTo(instance, FULL_VOLUME);
          setIsPlaying(true);
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
              frameState.durationMs = validDuration(ms, frameState.durationMs);
            });
          }
        });
        instance.bind(EVENTS.pause, () => {
          // 마지막 보고는 최대 수백 ms 낡았다. 보간해온 값으로 고정해야 멈춘 순간 시간이 뒤로 안 튄다.
          anchor(interpolated());
          remember(reported.current.ms);
          setIsPlaying(false);
        });
        const readBuffered = (loaded: number | undefined) => {
          if (typeof loaded === 'number' && Number.isFinite(loaded)) {
            frameState.buffered = Math.min(1, Math.max(0, loaded));
          }
        };
        instance.bind(EVENTS.progress, (payload) => {
          readBuffered(payload.loadedProgress);
          if (typeof payload.currentPosition !== 'number') return;
          reported.current = { ms: payload.currentPosition, at: performance.now(), live: true };
          if (performance.now() - savedAt.current >= SAVE_INTERVAL_MS) remember(payload.currentPosition);
        });
        // 재생을 눌러도 소리가 나기 전 구간이 있다. 그동안 진행바 뒤에 버퍼가 차는 걸 보여준다.
        instance.bind(EVENTS.buffer, (payload) => readBuffered(payload.loadedProgress));
        instance.bind(EVENTS.error, () => setEngineError('곡을 재생할 수 없습니다. 잠시 후 다시 시도해 주세요.'));
        instance.bind(EVENTS.finish, () => {
          // 다음 곡(또는 반복)은 0부터다. 끝난 위치를 물고 있으면 그 곡의 첫 순간이 끝 시간으로 보인다.
          anchor(0);
          advance.current();
        });
      })
      .catch((error: Error) => setEngineError(error.message));

    return () => {
      disposed = true;
      widget.current = null;
      if (fade.current !== null) clearInterval(fade.current);
      frame.remove();
    };
    // 엔진은 한 번만 만든다. 곡 교체는 widget.load로 처리한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((next: number, track: Track) => {
    const instance = widget.current;
    if (!instance) {
      queued.current = next;
      return;
    }
    reported.current = { ms: 0, at: performance.now(), live: false };
    // 고른 곡은 처음부터다 — 이어 들을 자리가 그 곡의 것일 때만 남긴다.
    shouldRewind.current = true;
    if (resume.current?.index !== next) resume.current = null;
    heldIndex.current = next;
    frameState.position = 0;
    frameState.buffered = 0;
    frameState.durationMs = track.durationMs;
    // 새 곡은 무음에서 올라온다. play 이벤트가 볼륨을 되올린다.
    volume.current = 0;
    instance.setVolume(0);

    const readDuration = () =>
      instance.getDuration((ms) => {
        frameState.durationMs = validDuration(ms, track.durationMs);
      });

    // 목록은 ready 시점의 것이 끝이 아니다 — 위젯이 프로필 곡을 나눠 싣는다(실측 20개 → 25개).
    // 전환할 때마다 다시 읽어야 위치가 맞는다. 우리 목록에 없는 사운드(최근 업로드)가 섞여 있어도 마찬가지다.
    instance.getSounds((sounds) => {
      soundIds.current = readSoundIds(sounds);
      // 위젯 안의 위치로 변환한다. TRACKS 인덱스를 그대로 넘기면 다른 곡이 걸린다.
      const soundIndex = soundIds.current.indexOf(track.id);

      if (soundIndex >= 0 && holdsSet.current) {
        // 이미 재생 중인 플레이어 안에서 옮겨간다 — 새 재생을 시작하지 않는 게 핵심이다.
        // 단, 위젯이 이미 그 사운드를 들고 있으면 skip은 아무 일도 하지 않는다(멈춰 있으면 계속 멈춘 채다).
        // 곡을 고른 건 듣겠다는 뜻이므로 그때는 play로 깨운다.
        instance.getCurrentSoundIndex((current) => {
          if (current === soundIndex) instance.play();
          else instance.skip(soundIndex);
        });
        return;
      }

      // 세트 밖 곡을 틀면 위젯이 세트를 잃는다.
      // 다시 세트 안 곡으로 돌아올 땐 세트를 복구해야 skip과 백그라운드 전환이 살아난다.
      const target = soundIndex >= 0 ? setUrl(tracks) : null;
      if (target) {
        instance.load(target, {
          auto_play: true,
          callback: () => {
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
    // tracks·setEngineMode는 앱 수명 동안 안 바뀐다. 엔진과 함께 한 번만 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 재개. 위젯이 지금 곡을 안 들고 있으면 그 곡을 걸고 처음부터 시작한다. */
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
      if (!track) return;
      if (next === index) {
        // 같은 곡을 다시 누르면 재생/정지 토글
        const instance = widget.current;
        if (!instance) {
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
    [goTo, index, pauseFaded, setIndex, start, tracks],
  );

  const toggle = useCallback(() => {
    const instance = widget.current;
    if (!instance) {
      queued.current = PLAY_CURRENT;
      return;
    }
    if (playing.current) pauseFaded(instance);
    else start(instance);
  }, [pauseFaded, start]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const count = tracks.length;
      if (count === 0) return;
      if (shuffle && direction === 1 && count > 1) {
        let next = index;
        while (next === index) next = Math.floor(Math.random() * count);
        select(next);
        return;
      }
      select((index + direction + count) % count);
    },
    [index, select, shuffle, tracks.length],
  );

  // 준비 전에 눌린 요청을 ready 직후 실행한다. index를 봐야 하므로 ref로 갱신한다.
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

  // 곡이 끝났을 때의 행동은 최신 shuffle/repeat 값을 봐야 하므로 ref로 갱신한다.
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
        holdsSet.current && !shuffle && soundIndex >= 0 && soundIndex < soundIds.current.length - 1;
      if (widgetAdvances) {
        // 위젯이 넘길 곡도 위젯이 물고 있던 위치에서 시작한다.
        shouldRewind.current = true;
        return;
      }

      // step(1)은 목록 끝에서 첫 곡으로 되돌아간다. 반복이 꺼져 있으면 거기서 멈춰야 한다.
      const isLastTrack = index === tracks.length - 1;
      if (isLastTrack && repeatMode === REPEAT_MODE.off) return;
      step(1);
    };
  }, [index, repeatMode, shuffle, step, tracks]);

  const seek = useCallback((ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    const ms = clamped * frameState.durationMs;
    // 스크럽은 즉시 반응해야 하므로 live로 둔다. 실제 위치와의 오차는 다음 보고가 잡는다.
    reported.current = { ms, at: performance.now(), live: true };
    frameState.position = clamped;
    widget.current?.seekTo(ms);
  }, []);

  const seekBy = useCallback(
    (seconds: number) => {
      if (frameState.durationMs === 0) return;
      seek(frameState.position + (seconds * 1000) / frameState.durationMs);
    },
    [seek],
  );

  // 보고값 + 경과시간으로 매 프레임 위치를 채운다.
  // 위젯이 길이를 알려주기 전에도 목록 데이터로 시간 표시가 맞아야 한다.
  useEffect(() => {
    const track = tracks[index];
    if (track) frameState.durationMs = validDuration(frameState.durationMs, track.durationMs);
  }, [index, tracks]);

  useFrame(() => {
    const { durationMs } = frameState;
    if (!Number.isFinite(durationMs) || durationMs <= 0) return;
    const { at, live } = reported.current;
    const elapsed = playing.current && live ? performance.now() - at : 0;
    frameState.position = Math.min(1, (reported.current.ms + elapsed) / durationMs);
  });

  return { select, toggle, step, seek, seekBy };
}
