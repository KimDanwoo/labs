'use client';

import type { Track } from '@entities/track';
import { useFrame } from '@shared/lib/frame';
import { useEffect, useRef } from 'react';
import { type Signals, accentAt } from '../../lib/waveformSignals';
import { frameState } from '../store/playback';
import { cache, warm } from '../waveformCache';
const LEVEL_SMOOTHING = 0.12;
const SWELL_SMOOTHING = 0.04;
/**
 * 비트 한 방이 hit 채널에 얹는 양과 사그라드는 시간.
 * 눈에 보이는 펄스는 파동이 맡고(무대가 beatId를 보고 쏜다) 여기선 블룸에 얇게 얹기만 한다 —
 * hit은 곡의 절정에 쓰는 채널이라 킥마다 최대로 때리면 PRD §6이 거부한 스터터가 된다.
 */
const BEAT_HIT = 0.25;
const BEAT_RELEASE_MS = 220;
/** 이보다 오래 지난 비트는 발화 없이 넘긴다 — 랙·탭 복귀 뒤 밀린 비트가 몰아 터지면 전부 엇박이다. */
const BEAT_STALE_MS = 150;

/**
 * 곡의 신호를 매 프레임 frameState에 채운다.
 * next는 미리 받아두기만 한다 — 전환 직후 신호가 한 박자 죽지 않게.
 */
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
    const step = Math.min(3, delta / 16.7);
    const nowMs = frameState.position * frameState.durationMs;
    const live = data && playing.current;

    if (!live) {
      frameState.level += (0 - frameState.level) * LEVEL_SMOOTHING * step;
      frameState.swell += (0 - frameState.swell) * SWELL_SMOOTHING * step;
      frameState.bass += (0 - frameState.bass) * LEVEL_SMOOTHING * step;
      frameState.air += (0 - frameState.air) * LEVEL_SMOOTHING * step;
      frameState.pre = 0;
      frameState.hit = 0;
      return;
    }

    const index = Math.min(data.level.length - 1, Math.max(0, Math.floor((nowMs / 1000) * data.fps)));
    frameState.level += ((data.level[index] ?? 0) - frameState.level) * LEVEL_SMOOTHING * step;
    frameState.swell += ((data.swell[index] ?? 0) - frameState.swell) * SWELL_SMOOTHING * step;
    frameState.bass += ((data.bass?.[index] ?? 0) - frameState.bass) * LEVEL_SMOOTHING * step;
    frameState.air += ((data.air?.[index] ?? 0) - frameState.air) * LEVEL_SMOOTHING * step;

    if (nowMs < beat.current.atMs) {
      beat.current.cursor = data.beats.findIndex(([ms]) => ms >= nowMs);
      if (beat.current.cursor < 0) beat.current.cursor = data.beats.length;
    }
    beat.current.atMs = nowMs;

    beat.current.value = Math.max(0, beat.current.value - delta / BEAT_RELEASE_MS);
    let struck = 0;
    while (beat.current.cursor < data.beats.length) {
      const line = data.beats[beat.current.cursor];
      if (!line || line[0] > nowMs) break;
      if (nowMs - line[0] <= BEAT_STALE_MS) {
        const strength = line[1] / 255;
        beat.current.value = Math.max(beat.current.value, strength * BEAT_HIT);
        struck = Math.max(struck, strength);
      }
      beat.current.cursor++;
    }
    if (struck > 0) {
      frameState.beatStrength = struck;
      frameState.beatId++;
    }

    // 악센트는 이미 시간 램프라 다시 스무딩하지 않는다 — 뭉개면 들이쉼이 사라진다.
    const accent = accentAt(data.peakMs, nowMs);
    frameState.pre = accent.pre;
    frameState.hit = Math.max(accent.hit, beat.current.value);
  });
}
