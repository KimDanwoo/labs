'use client';

import { useFrame } from '@shared/lib/frame';
import { type PositionReport, advanceClock, estimatePosition } from '@views/player/lib/playbackClock';
import { frameState } from '@views/player/model/store/playback';
import { type RefObject, useCallback, useRef } from 'react';

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
    if (!Number.isFinite(durationMs)) return;
    if (durationMs <= 0) return;
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
