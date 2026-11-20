'use client';

import type { Track } from '@entities/track';
import { useFrame } from '@shared/lib/frame';
import { MS_PER_SECOND } from '@views/player/config/time';
import { type Signals, accentAt } from '@views/player/lib/waveformSignals';
import { frameState } from '@views/player/model/store/playback';
import { cache, warm } from '@views/player/model/waveformCache';
import { useEffect, useRef } from 'react';
const LEVEL_SMOOTHING = 0.12;
const SWELL_SMOOTHING = 0.04;
const BEAT_HIT = 0.25;
const BEAT_RELEASE_MS = 220;
const BEAT_STALE_MS = 150;

const MAX_FRAME_STEP = 3;
const FRAME_MS = 16.7;
const BEAT_STRENGTH_MAX = 255;

interface BeatState {
  value: number;
  cursor: number;
  atMs: number;
}

function relaxFrameState(step: number): void {
  frameState.level += (0 - frameState.level) * LEVEL_SMOOTHING * step;
  frameState.swell += (0 - frameState.swell) * SWELL_SMOOTHING * step;
  frameState.bass += (0 - frameState.bass) * LEVEL_SMOOTHING * step;
  frameState.air += (0 - frameState.air) * LEVEL_SMOOTHING * step;
  frameState.pre = 0;
  frameState.hit = 0;
}

function followSignals(data: Signals, nowMs: number, step: number): void {
  const index = Math.min(data.level.length - 1, Math.max(0, Math.floor((nowMs / MS_PER_SECOND) * data.fps)));
  frameState.level += ((data.level[index] ?? 0) - frameState.level) * LEVEL_SMOOTHING * step;
  frameState.swell += ((data.swell[index] ?? 0) - frameState.swell) * SWELL_SMOOTHING * step;
  frameState.bass += ((data.bass?.[index] ?? 0) - frameState.bass) * LEVEL_SMOOTHING * step;
  frameState.air += ((data.air?.[index] ?? 0) - frameState.air) * LEVEL_SMOOTHING * step;
}

function seekBeatCursor(beat: BeatState, data: Signals, nowMs: number): void {
  if (nowMs < beat.atMs) {
    beat.cursor = data.beats.findIndex(([ms]) => ms >= nowMs);
    if (beat.cursor < 0) beat.cursor = data.beats.length;
  }
  beat.atMs = nowMs;
}

function strikeBeats(beat: BeatState, data: Signals, nowMs: number, delta: number): void {
  beat.value = Math.max(0, beat.value - delta / BEAT_RELEASE_MS);
  let struck = 0;
  while (beat.cursor < data.beats.length) {
    const line = data.beats[beat.cursor];
    if (!line) break;
    if (line[0] > nowMs) break;
    if (nowMs - line[0] <= BEAT_STALE_MS) {
      const strength = line[1] / BEAT_STRENGTH_MAX;
      beat.value = Math.max(beat.value, strength * BEAT_HIT);
      struck = Math.max(struck, strength);
    }
    beat.cursor++;
  }
  if (struck <= 0) return;
  frameState.beatStrength = struck;
  frameState.beatId++;
}

export function useWaveform(track: Track | undefined, next: Track | undefined, isPlaying: boolean) {
  const signals = useRef<Signals | null>(null);
  const playing = useRef(isPlaying);
  const beat = useRef({ value: 0, cursor: 0, atMs: 0 });

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let disposed = false;
    signals.current = track ? (cache.get(track.id) ?? null) : null;
    beat.current = { value: 0, cursor: 0, atMs: 0 };

    warm(track).then(() => {
      if (disposed) return;
      if (track) signals.current = cache.get(track.id) ?? null;
      warm(next);
    });

    return () => {
      disposed = true;
    };
  }, [next, track]);

  useFrame((delta) => {
    const data = signals.current;
    const step = Math.min(MAX_FRAME_STEP, delta / FRAME_MS);
    const nowMs = frameState.position * frameState.durationMs;

    const isIdle = !data || !playing.current;
    if (isIdle) {
      relaxFrameState(step);
      return;
    }

    followSignals(data, nowMs, step);
    seekBeatCursor(beat.current, data, nowMs);
    strikeBeats(beat.current, data, nowMs, delta);

    const accent = accentAt(data.peakMs, nowMs);
    frameState.pre = accent.pre;
    frameState.hit = Math.max(accent.hit, beat.current.value);
  });
}
