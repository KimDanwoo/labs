'use client';

import { fetchBands, fetchWaveform } from '@entities/track/model/services';
import { frameState } from '@entities/track/model/store';
import type { Track } from '@entities/track/model/types';
import { useFrame } from '@shared/lib/frame';
import { useEffect, useRef } from 'react';

/**
 * PRD §6 "음악 악센트 — 신호 설계".
 *
 * 신호 출처는 둘이고 모양은 하나다.
 * - 원곡 분석(`public/signals/{id}.json`, scripts/analyze-audio.mjs): 43Hz 3대역 + 비트 격자.
 *   대역 간 상관이 -0.004~0.29로 거의 독립이라 저·중·고를 각각 다른 시각 채널에 물릴 수 있다.
 * - 사클 파형 폴백: 진폭 하나를 8.6Hz로 준다. 대역을 나눌 수 없어 bass·air는 0으로 남는다.
 *
 * 마스터링된 트랙의 파형은 포화 상태여서(정규화 전 평균 0.76–0.82) 그대로 쓰면 level이 0.8 고정이다.
 * 실측: `새벽`의 파티클 확대 폭이 0.29%p(반경 1.3px)였다. 그래서 곡별 백분위로 다시 편다.
 */

/** 재매핑 기준. p10 아래는 0, p95 위는 1로 눕힌다. */
const FLOOR_PERCENTILE = 0.1;
const CEIL_PERCENTILE = 0.95;
/** swell 창 길이. 프레이즈 하나가 들어가는 크기. */
const SWELL_WINDOW_MS = 4000;
/**
 * 악센트로 삼을 피크 수와 최소 간격(곡 길이 비율). 간격이 없으면 한 절정에서 세 번 터진다.
 * 고정 12초로 재보니 세 개가 절정부에 몰려 곡의 26~53% 구간에만 분포했다 — 앞 2분이 조용한 곡이 나온다.
 * 길이의 1/5로 두면 41~60%로 퍼지는데 절정 세기는 4~9%만 준다. 더 퍼뜨리려면 이 값을 키운다.
 */
const PEAK_COUNT = 3;
const PEAK_GAP_RATIO = 1 / 5;
/** 피크 앞의 들이쉼과 뒤의 릴리스. */
const PRE_MS = 300;
const HIT_MS = 900;
/** 프레임 스무딩. level·bass·air는 따라붙고 swell은 느리게 흐른다. */
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

type Signals = {
  /** 초당 샘플 수. 두 출처의 해상도가 달라 인덱싱은 절대 시각으로 한다. */
  fps: number;
  /** 0–1. 원곡 분석이면 중역, 폴백이면 재매핑된 진폭. */
  level: Float32Array;
  swell: Float32Array;
  /** 원곡 분석에서만 채워진다. */
  bass: Float32Array | null;
  air: Float32Array | null;
  peakMs: number[];
  /** [시각ms, 세기 0–255]. 격자를 못 찾은 곡은 빈 배열. */
  beats: readonly (readonly [number, number])[];
};

const percentile = (sorted: Float32Array, ratio: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(ratio * sorted.length))] ?? 0;

/** 창 안의 평균을 누적합으로 한 번에 낸다 — 곡마다 수천 샘플이라 O(n)이면 체감이 없다. */
function movingAverage(values: Float32Array, window: number) {
  const out = new Float32Array(values.length);
  const sums = new Float64Array(values.length + 1);
  for (let i = 0; i < values.length; i++) sums[i + 1] = (sums[i] ?? 0) + (values[i] ?? 0);

  const half = Math.max(1, Math.floor(window / 2));
  for (let i = 0; i < values.length; i++) {
    const from = Math.max(0, i - half);
    const to = Math.min(values.length, i + half);
    out[i] = ((sums[to] ?? 0) - (sums[from] ?? 0)) / (to - from);
  }
  return out;
}

/** swell이 가장 높은 지점을 간격을 두고 고른다. level로 고르면 잡음에서 절정이 아닌 곳이 뽑힌다. */
function pickPeaks(swell: Float32Array, msPerSample: number) {
  const order = [...swell.keys()].sort((a, b) => (swell[b] ?? 0) - (swell[a] ?? 0));
  const gap = swell.length * PEAK_GAP_RATIO;
  const picked: number[] = [];

  for (const index of order) {
    if (picked.length >= PEAK_COUNT) break;
    if (picked.every((chosen) => Math.abs(chosen - index) >= gap)) picked.push(index);
  }
  return picked.sort((a, b) => a - b).map((index) => index * msPerSample);
}

/** 포화된 진폭을 곡별 백분위로 다시 편다. */
function remap(raw: Float32Array) {
  const sorted = Float32Array.from(raw).sort();
  const floor = percentile(sorted, FLOOR_PERCENTILE);
  const span = Math.max(1e-6, percentile(sorted, CEIL_PERCENTILE) - floor);
  return Float32Array.from(raw, (value) => Math.min(1, Math.max(0, (value - floor) / span)));
}

function withDerived(level: Float32Array, fps: number, extra: Pick<Signals, 'bass' | 'air' | 'beats'>): Signals {
  const msPerSample = 1000 / fps;
  const swell = movingAverage(level, SWELL_WINDOW_MS / msPerSample);
  return { fps, level, swell, peakMs: pickPeaks(swell, msPerSample), ...extra };
}

function deriveSignals(raw: Float32Array, durationMs: number): Signals {
  const fps = raw.length / (durationMs / 1000);
  return withDerived(remap(raw), fps, { bass: null, air: null, beats: [] });
}

/** 피크 앞에서 차오르고(pre) 피크를 지나며 풀린다(hit). 릴리스는 제곱으로 떨어져 꼬리가 남는다. */
function accentAt(peakMs: readonly number[], nowMs: number) {
  let pre = 0;
  let hit = 0;
  for (const peak of peakMs) {
    const delta = nowMs - peak;
    if (delta < 0 && delta > -PRE_MS) pre = Math.max(pre, 1 + delta / PRE_MS);
    else if (delta >= 0 && delta < HIT_MS) hit = Math.max(hit, (1 - delta / HIT_MS) ** 2);
  }
  return { pre, hit };
}

const cache = new Map<number, Signals>();
const inFlight = new Map<number, Promise<void>>();

/** 원곡 분석 신호를 먼저 찾고, 없으면 사클 파형으로 떨어진다. */
async function load(track: Track): Promise<Signals> {
  const bands = await fetchBands(track.id).catch(() => null);
  if (bands) {
    return withDerived(bands.mid, bands.fps, { bass: bands.low, air: bands.high, beats: bands.beats });
  }
  return deriveSignals(await fetchWaveform(track.waveformUrl), track.durationMs);
}

function warm(track: Track | undefined): Promise<void> {
  if (!track || cache.has(track.id)) return Promise.resolve();
  const existing = inFlight.get(track.id);
  if (existing) return existing;

  const loading = load(track)
    .then((signals) => {
      cache.set(track.id, signals);
    })
    // 신호가 없으면 전부 0으로 남아 정적 렌더로 degrade한다. 화면이 멈추지는 않는다.
    .catch(() => undefined)
    .finally(() => inFlight.delete(track.id));

  inFlight.set(track.id, loading);
  return loading;
}

/**
 * 곡의 신호를 매 프레임 frameState에 채운다.
 * next는 미리 받아두기만 한다 — 전환 직후 신호가 한 박자 죽지 않게.
 */
export function useWaveform(track: Track | undefined, next: Track | undefined, isPlaying: boolean) {
  const signals = useRef<Signals | null>(null);
  const playing = useRef(isPlaying);
  // 비트 임펄스의 잔향과, 다음에 넘을 격자선 위치. 되감으면 다시 찾는다.
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
    // 진폭을 그대로 쓰면 반짝임이 노이즈로 읽힌다. 완만하게 따라가게 한다.
    frameState.level += ((data.level[index] ?? 0) - frameState.level) * LEVEL_SMOOTHING * step;
    frameState.swell += ((data.swell[index] ?? 0) - frameState.swell) * SWELL_SMOOTHING * step;
    frameState.bass += ((data.bass?.[index] ?? 0) - frameState.bass) * LEVEL_SMOOTHING * step;
    frameState.air += ((data.air?.[index] ?? 0) - frameState.air) * LEVEL_SMOOTHING * step;

    // 되감거나 곡을 옮겼으면 격자 커서를 다시 잡는다.
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
    // 사건을 카운터로 알린다 — 무대가 이걸 보고 파동을 쏜다.
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
