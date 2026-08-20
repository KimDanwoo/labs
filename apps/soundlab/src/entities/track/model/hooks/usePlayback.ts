'use client';

import { useFrame } from '@shared/lib/frame';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { REPEAT_MODE } from '../constants/repeatMode';
import { loadWidgetApi, setUrl, soundId, trackUrl, widgetSrc, type ScWidget } from '../services';
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

const EVENTS = {
  ready: 'ready',
  play: 'play',
  pause: 'pause',
  finish: 'finish',
  progress: 'playProgress',
} as const;

export type Playback = {
  select: (index: number) => void;
  toggle: () => void;
  step: (direction: 1 | -1) => void;
  seek: (ratio: number) => void;
  seekBy: (seconds: number) => void;
};

export function usePlayback(tracks: readonly Track[]): Playback {
  const [index, setIndex] = useAtom(currentIndexAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const setIsReady = useSetAtom(isReadyAtom);
  const setEngineError = useSetAtom(engineErrorAtom);
  const setEngineMode = useSetAtom(engineModeAtom);
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);

  const widget = useRef<ScWidget | null>(null);
  // PLAY_PROGRESS는 수백 ms 간격이라 60fps에 부족하다. 마지막 보고값과 시각을 남겨 rAF에서 보간한다.
  const reported = useRef({ ms: 0, at: 0 });
  const playing = useRef(false);
  const advance = useRef<() => void>(() => {});
  // 위젯이 지금 세트를 들고 있는가. 들고 있으면 전환이 skip으로 끝나 새 재생을 시작하지 않는다
  // — 백그라운드 자동 전환의 조건이다. 세트 밖 곡을 load하면 세트를 잃고 false가 된다.
  const holdsSet = useRef(false);
  // 세트에 실린 곡 순서(위치 → 트랙 id). 위젯은 프로필의 최신 20곡만 주고 순서 보장도 없어서
  // skip 대상과 현재 곡 하이라이트를 위치가 아니라 id로 맞춘다.
  const soundIds = useRef<number[]>([]);

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

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
            soundIds.current = Array.isArray(sounds)
              ? sounds.map(soundId).filter((id): id is number => id !== null)
              : [];
            holdsSet.current = soundIds.current.length > 1;
            setEngineMode(holdsSet.current ? 'set' : 'single');
          });
          instance.getDuration((ms) => {
            frameState.durationMs = validDuration(ms, frameState.durationMs);
          });
          setIsReady(true);
        });
        instance.bind(EVENTS.play, () => {
          setIsPlaying(true);
          if (holdsSet.current) {
            // 위젯이 스스로 다음 곡으로 넘어간 경우도 여기로 들어온다 — 목록 하이라이트를 여기서 맞춘다.
            instance.getCurrentSoundIndex((soundIndex) => {
              const id = soundIds.current[soundIndex];
              if (id === undefined) return;
              const next = tracks.findIndex((track) => track.id === id);
              if (next >= 0) setIndex(next);
            });
            instance.getDuration((ms) => {
              frameState.durationMs = validDuration(ms, frameState.durationMs);
            });
          }
        });
        instance.bind(EVENTS.pause, () => setIsPlaying(false));
        instance.bind(EVENTS.progress, (payload) => {
          if (typeof payload.currentPosition !== 'number') return;
          reported.current = { ms: payload.currentPosition, at: performance.now() };
        });
        instance.bind(EVENTS.finish, () => advance.current());
      })
      .catch((error: Error) => setEngineError(error.message));

    return () => {
      disposed = true;
      widget.current = null;
      frame.remove();
    };
    // 엔진은 한 번만 만든다. 곡 교체는 widget.load로 처리한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((next: number, track: Track) => {
    const instance = widget.current;
    if (!instance) return;
    reported.current = { ms: 0, at: performance.now() };
    frameState.position = 0;
    frameState.durationMs = track.durationMs;

    // 위젯 안의 위치로 변환한다. TRACKS 인덱스를 그대로 넘기면 다른 곡이 걸린다.
    const soundIndex = soundIds.current.indexOf(track.id);

    if (soundIndex >= 0 && holdsSet.current) {
      // 이미 재생 중인 플레이어 안에서 옮겨간다 — 새 재생을 시작하지 않는 게 핵심이다.
      instance.skip(soundIndex);
      return;
    }

    const readDuration = () =>
      instance.getDuration((ms) => {
        frameState.durationMs = validDuration(ms, track.durationMs);
      });

    // 세트 밖 곡(위젯이 주는 20곡에 없는 오래된 곡)을 틀면 위젯이 세트를 잃는다.
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
    // tracks·setEngineMode는 앱 수명 동안 안 바뀐다. 엔진과 함께 한 번만 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = useCallback(
    (next: number) => {
      const track = tracks[next];
      if (!track) return;
      if (next === index) {
        // 같은 곡을 다시 누르면 재생/정지 토글
        if (playing.current) widget.current?.pause();
        else widget.current?.play();
        return;
      }
      setIndex(next);
      goTo(next, track);
    },
    [goTo, index, setIndex, tracks],
  );

  const toggle = useCallback(() => {
    if (playing.current) widget.current?.pause();
    else widget.current?.play();
  }, []);

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
      if (widgetAdvances) return;

      // step(1)은 목록 끝에서 첫 곡으로 되돌아간다. 반복이 꺼져 있으면 거기서 멈춰야 한다.
      const isLastTrack = index === tracks.length - 1;
      if (isLastTrack && repeatMode === REPEAT_MODE.off) return;
      step(1);
    };
  }, [index, repeatMode, shuffle, step, tracks]);

  const seek = useCallback((ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    const ms = clamped * frameState.durationMs;
    reported.current = { ms, at: performance.now() };
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
    const elapsed = playing.current ? performance.now() - reported.current.at : 0;
    frameState.position = Math.min(1, (reported.current.ms + elapsed) / durationMs);
  });

  return { select, toggle, step, seek, seekBy };
}
