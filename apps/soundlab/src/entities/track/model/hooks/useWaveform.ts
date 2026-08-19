'use client';

import { useFrame } from '@shared/lib/frame';
import { useEffect, useRef } from 'react';
import { fetchWaveform } from '../services';
import { frameState } from '../store';
import type { Track } from '../types';

const cache = new Map<number, Float32Array>();

/**
 * 곡의 파형 진폭을 받아 캐시하고, 매 프레임 재생 위치의 진폭을 frameState.level에 채운다.
 * 실패하면 level을 0으로 두고 조용히 degrade한다 — 비주얼이 멈추지는 않는다.
 */
export function useWaveform(track: Track | undefined, isPlaying: boolean) {
  const samples = useRef<Float32Array | null>(null);
  const playing = useRef(isPlaying);

  useEffect(() => {
    playing.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let disposed = false;
    const cached = track ? cache.get(track.id) : undefined;
    samples.current = cached ?? null;

    if (track && !cached) {
      fetchWaveform(track.waveformUrl)
        .then((data) => {
          cache.set(track.id, data);
          if (!disposed) samples.current = data;
        })
        // 파형이 없으면 level이 0으로 남아 정적 렌더로 degrade한다. 화면이 멈추지는 않는다.
        .catch(() => undefined);
    }

    return () => {
      disposed = true;
    };
  }, [track]);

  useFrame((delta) => {
    const data = samples.current;
    const raw =
      data && playing.current
        ? (data[Math.min(data.length - 1, Math.floor(frameState.position * data.length))] ?? 0)
        : 0;
    // 진폭을 그대로 쓰면 반짝임이 노이즈로 읽힌다. 완만하게 따라가게 한다.
    frameState.level += (raw - frameState.level) * 0.12 * Math.min(3, delta / 16.7);
  });
}
