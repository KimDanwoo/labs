'use client';

import { useFrame } from '@shared/lib/frame';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { loadWidgetApi, multiTrackUrl, trackUrl, widgetSrc, type ScWidget } from '../services';
import {
  currentIndexAtom,
  engineErrorAtom,
  engineModeAtom,
  frameState,
  isPlayingAtom,
  isReadyAtom,
  repeatOneAtom,
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
  const repeatOne = useAtomValue(repeatOneAtom);

  const widget = useRef<ScWidget | null>(null);
  // PLAY_PROGRESS는 수백 ms 간격이라 60fps에 부족하다. 마지막 보고값과 시각을 남겨 rAF에서 보간한다.
  const reported = useRef({ ms: 0, at: 0 });
  const playing = useRef(false);
  const advance = useRef<() => void>(() => {});
  // 'set'이면 skip으로 즉시 전환한다. 'single'이면 곡별 load(느림)로 폴백.
  const mode = useRef<'set' | 'single'>('single');

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
    // 24곡을 한 번에 올려본다. 받아들여지면 전환이 skip으로 끝난다.
    frame.src = widgetSrc(multiTrackUrl(tracks));
    document.body.append(frame);

    loadWidgetApi()
      .then((sc) => {
        if (disposed) return;
        const instance = sc.Widget(frame);
        widget.current = instance;

        instance.bind(EVENTS.ready, () => {
          // 다중 트랙 URL이 실제로 먹혔는지 런타임에 확인한다.
          instance.getSounds((sounds) => {
            const isSet = Array.isArray(sounds) && sounds.length === tracks.length;
            mode.current = isSet ? 'set' : 'single';
            setEngineMode(isSet ? 'set' : 'single');
          });
          instance.getDuration((ms) => {
            frameState.durationMs = validDuration(ms, frameState.durationMs);
          });
          setIsReady(true);
        });
        instance.bind(EVENTS.play, () => {
          setIsPlaying(true);
          if (mode.current === 'set') {
            instance.getCurrentSoundIndex((soundIndex) => {
              if (typeof soundIndex === 'number') setIndex(soundIndex);
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

    if (mode.current === 'set') {
      // iframe 재탐색 없음 — 이게 전환 속도의 핵심이다.
      instance.skip(next);
      return;
    }
    instance.load(trackUrl(track), {
      auto_play: true,
      show_artwork: false,
      show_comments: false,
      callback: () =>
        instance.getDuration((ms) => {
          frameState.durationMs = validDuration(ms, track.durationMs);
        }),
    });
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
      if (repeatOne) {
        widget.current?.seekTo(0);
        widget.current?.play();
        return;
      }
      // set 모드에서 순차 재생은 위젯이 스스로 넘긴다(play 이벤트로 인덱스가 동기화된다).
      // 여기서 또 넘기면 한 곡을 건너뛴다. 셔플일 때만 개입한다.
      if (mode.current === 'set' && !shuffle) return;
      step(1);
    };
  }, [repeatOne, shuffle, step]);

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
