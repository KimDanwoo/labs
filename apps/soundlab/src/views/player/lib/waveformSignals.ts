const FLOOR_PERCENTILE = 0.1;
const CEIL_PERCENTILE = 0.95;
const SWELL_WINDOW_MS = 4000;
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
    const isBeforePeak = delta < 0 && delta > -PRE_MS;
    const isOnPeak = delta >= 0 && delta < HIT_MS;
    if (isBeforePeak) pre = Math.max(pre, 1 + delta / PRE_MS);
    else if (isOnPeak) hit = Math.max(hit, (1 - delta / HIT_MS) ** 2);
  }
  return { pre, hit };
}
