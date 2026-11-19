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
const FLOOR_PERCENTILE = 0.1;
const CEIL_PERCENTILE = 0.95;
const SWELL_WINDOW_MS = 4000;
/**
 * 악센트로 삼을 피크 수와 최소 간격(곡 길이 비율). 간격이 없으면 한 절정에서 세 번 터진다.
 * 고정 12초로 재보니 세 개가 절정부에 몰려 곡의 26~53% 구간에만 분포했다 — 앞 2분이 조용한 곡이 나온다.
 * 길이의 1/5로 두면 41~60%로 퍼지는데 절정 세기는 4~9%만 준다. 더 퍼뜨리려면 이 값을 키운다.
 */
const PEAK_COUNT = 3;
const PEAK_GAP_RATIO = 1 / 5;
const PRE_MS = 300;
const HIT_MS = 900;
export type Signals = {
  fps: number;
  level: Float32Array;
  swell: Float32Array;
  bass: Float32Array | null;
  air: Float32Array | null;
  peakMs: number[];
  beats: readonly (readonly [number, number])[];
};
const percentile = (sorted: Float32Array, ratio: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(ratio * sorted.length))] ?? 0;
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
function remap(raw: Float32Array) {
  const sorted = Float32Array.from(raw).sort();
  const floor = percentile(sorted, FLOOR_PERCENTILE);
  const span = Math.max(1e-6, percentile(sorted, CEIL_PERCENTILE) - floor);
  return Float32Array.from(raw, (value) => Math.min(1, Math.max(0, (value - floor) / span)));
}
export function withDerived(level: Float32Array, fps: number, extra: Pick<Signals, 'bass' | 'air' | 'beats'>): Signals {
  const msPerSample = 1000 / fps;
  const swell = movingAverage(level, SWELL_WINDOW_MS / msPerSample);
  return { fps, level, swell, peakMs: pickPeaks(swell, msPerSample), ...extra };
}
export function deriveSignals(raw: Float32Array, durationMs: number): Signals {
  const fps = raw.length / (durationMs / 1000);
  return withDerived(remap(raw), fps, { bass: null, air: null, beats: [] });
}
export function accentAt(peakMs: readonly number[], nowMs: number) {
  let pre = 0;
  let hit = 0;
  for (const peak of peakMs) {
    const delta = nowMs - peak;
    if (delta < 0 && delta > -PRE_MS) pre = Math.max(pre, 1 + delta / PRE_MS);
    else if (delta >= 0 && delta < HIT_MS) hit = Math.max(hit, (1 - delta / HIT_MS) ** 2);
  }
  return { pre, hit };
}
