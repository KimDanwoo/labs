const MAX_FRAMES = 1_000_000;
const MAX_FPS = 120;
const MAX_DURATION_MS = 12 * 60 * 60 * 1000;
type BandSignals = { fps: number; audioMs: number; low: string; mid: string; high: string; beats: [number, number][] };

export function parseWaveform(raw: unknown): Float32Array {
  if (typeof raw !== 'object' || raw === null || !('samples' in raw) || !Array.isArray(raw.samples)) {
    throw new Error('파형 형식이 잘못됐습니다');
  }
  const samples: unknown[] = raw.samples;
  if (
    !samples.length ||
    samples.length > MAX_FRAMES ||
    !samples.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
  ) {
    throw new Error('파형 샘플이 잘못됐습니다');
  }
  const values = samples.filter((value): value is number => typeof value === 'number');
  const height =
    'height' in raw && typeof raw.height === 'number' && Number.isFinite(raw.height) && raw.height > 0
      ? raw.height
      : values.reduce((max, value) => Math.max(max, value), 1);
  return Float32Array.from(values, (value) => Math.min(1, value / height));
}

export function parseBandSignals(raw: unknown): BandSignals | null {
  if (typeof raw !== 'object' || raw === null) return null;
  if (!('fps' in raw) || typeof raw.fps !== 'number' || !Number.isFinite(raw.fps) || raw.fps <= 0 || raw.fps > MAX_FPS)
    return null;
  if (
    !('audioMs' in raw) ||
    typeof raw.audioMs !== 'number' ||
    !Number.isFinite(raw.audioMs) ||
    raw.audioMs <= 0 ||
    raw.audioMs > MAX_DURATION_MS
  )
    return null;
  const isBand = (value: unknown): value is string =>
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_FRAMES * 2 &&
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
  if (
    !('low' in raw) ||
    !isBand(raw.low) ||
    !('mid' in raw) ||
    !isBand(raw.mid) ||
    !('high' in raw) ||
    !isBand(raw.high)
  )
    return null;
  if (raw.low.length !== raw.mid.length || raw.low.length !== raw.high.length) return null;
  if (!('beats' in raw) || !Array.isArray(raw.beats) || raw.beats.length > MAX_FRAMES) return null;
  const beats: [number, number][] = [];
  let previous = -1;
  for (const beat of raw.beats) {
    if (!Array.isArray(beat) || beat.length !== 2) return null;
    const [ms, strength]: unknown[] = beat;
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < previous || ms < 0 || ms > raw.audioMs) return null;
    if (typeof strength !== 'number' || !Number.isFinite(strength) || strength < 0 || strength > 255) return null;
    beats.push([ms, strength]);
    previous = ms;
  }
  return { fps: raw.fps, audioMs: raw.audioMs, low: raw.low, mid: raw.mid, high: raw.high, beats };
}
