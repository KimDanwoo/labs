const MAX_FRAMES = 1_000_000;
const MAX_FPS = 120;
const MAX_DURATION_MS = 12 * 60 * 60 * 1000;
type BandSignals = { fps: number; audioMs: number; low: string; mid: string; high: string; beats: [number, number][] };

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const MAX_BEAT_STRENGTH = 255;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveFinite(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isBand(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_FRAMES * 2 && BASE64_PATTERN.test(value);
}

function readSamples(raw: object): number[] {
  if (!('samples' in raw) || !Array.isArray(raw.samples)) throw new Error('파형 형식이 잘못됐습니다');
  const samples: unknown[] = raw.samples;
  const isValid =
    samples.length > 0 && samples.length <= MAX_FRAMES && samples.every((v) => isFiniteNumber(v) && v >= 0);
  if (!isValid) throw new Error('파형 샘플이 잘못됐습니다');
  return samples.filter((value): value is number => typeof value === 'number');
}

function readHeight(raw: object, values: number[]): number {
  if ('height' in raw && isPositiveFinite(raw.height)) return raw.height;
  return values.reduce((max, value) => Math.max(max, value), 1);
}

export function parseWaveform(raw: unknown): Float32Array {
  if (typeof raw !== 'object' || raw === null) throw new Error('파형 형식이 잘못됐습니다');
  const values = readSamples(raw);
  const height = readHeight(raw, values);
  return Float32Array.from(values, (value) => Math.min(1, value / height));
}

function readRange(value: unknown, max: number): number | null {
  return isPositiveFinite(value) && value <= max ? value : null;
}

function isValidBeat(beat: unknown, previous: number, audioMs: number): beat is [number, number] {
  if (!Array.isArray(beat) || beat.length !== 2) return false;
  const [ms, strength]: unknown[] = beat;
  if (!isFiniteNumber(ms) || ms < previous || ms < 0 || ms > audioMs) return false;
  return isFiniteNumber(strength) && strength >= 0 && strength <= MAX_BEAT_STRENGTH;
}

function readBeats(rawBeats: unknown, audioMs: number): [number, number][] | null {
  if (!Array.isArray(rawBeats) || rawBeats.length > MAX_FRAMES) return null;
  const beats: [number, number][] = [];
  let previous = -1;
  for (const beat of rawBeats) {
    if (!isValidBeat(beat, previous, audioMs)) return null;
    beats.push([beat[0], beat[1]]);
    previous = beat[0];
  }
  return beats;
}

interface Bands {
  low: string;
  mid: string;
  high: string;
}

function readBands(raw: object): Bands | null {
  if (!('low' in raw) || !isBand(raw.low)) return null;
  if (!('mid' in raw) || !isBand(raw.mid)) return null;
  if (!('high' in raw) || !isBand(raw.high)) return null;
  if (raw.low.length !== raw.mid.length || raw.low.length !== raw.high.length) return null;
  return { low: raw.low, mid: raw.mid, high: raw.high };
}

export function parseBandSignals(raw: unknown): BandSignals | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const fps = 'fps' in raw ? readRange(raw.fps, MAX_FPS) : null;
  const audioMs = 'audioMs' in raw ? readRange(raw.audioMs, MAX_DURATION_MS) : null;
  if (fps === null || audioMs === null) return null;
  const bands = readBands(raw);
  const beats = 'beats' in raw ? readBeats(raw.beats, audioMs) : null;
  if (!bands || !beats) return null;
  return { fps, audioMs, ...bands, beats };
}
