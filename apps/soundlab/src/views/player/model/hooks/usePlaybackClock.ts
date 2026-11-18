'use client';

import { useFrame } from '@shared/lib/frame';
import { type RefObject, useCallback, useRef } from 'react';
import { type PositionReport, advanceClock, estimatePosition } from '../../lib/playbackClock';
import { frameState } from '../store/playback';

/**
 * PLAY_PROGRESS는 수백 ms 간격이라 60fps에 부족하다. 마지막 보고값과 시각을 남겨 rAF에서 보간한다.
 * live = 그 보고가 "지금 흐르는 소리"의 것인가. play 이벤트는 버퍼링 전에 오므로
 * 첫 보고를 받기 전까지 보간을 세워둔다 — 안 세우면 소리 없이 시간이 흐르다 0으로 되돌아간다.
 */
export function usePlaybackClock(playing: RefObject<boolean>) {
  const reported = useRef<PositionReport>({ ms: 0, at: 0, live: false });
  const smoothMs = useRef(0);

  const anchor = useCallback((ms: number) => {
    reported.current = { ms, at: performance.now(), live: false };
  }, []);

  const report = useCallback((ms: number) => {
    reported.current = { ms, at: performance.now(), live: true };
  }, []);

  const settle = useCallback(
    (ms: number) => {
      report(ms);
      smoothMs.current = ms;
    },
    [report],
  );

  const interpolated = useCallback(
    () => estimatePosition(reported.current, playing.current, performance.now()),
    [playing],
  );

  const reportedMs = useCallback(() => reported.current.ms, []);

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

  return { anchor, report, settle, interpolated, reportedMs };
}
