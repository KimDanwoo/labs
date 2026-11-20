import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TMP = join(HERE, '..', '..', 'node_modules', '.cache', 'soundlab-pcm.raw');

export const SAMPLE_RATE = 22050;
const FFT_SIZE = 1024;
const HOP = 512;
export const FPS = SAMPLE_RATE / HOP;

const BAND_EDGES = [
  [20, 200],
  [200, 4000],
  [4000, SAMPLE_RATE / 2],
];

export function probeDurationMs(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8' },
  );
  const seconds = Number.parseFloat(out.trim());
  return Number.isFinite(seconds) ? seconds * 1000 : Number.NaN;
}

export function decodeMono(file) {
  mkdirSync(dirname(TMP), { recursive: true });
  execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-map', '0:a:0', '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', TMP, '-y'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const buffer = readFileSync(TMP);
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

const reverse = new Uint32Array(FFT_SIZE);
for (let i = 0, bits = Math.log2(FFT_SIZE); i < FFT_SIZE; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  reverse[i] = r;
}
const twiddleCos = new Float64Array(FFT_SIZE / 2);
const twiddleSin = new Float64Array(FFT_SIZE / 2);
for (let i = 0; i < FFT_SIZE / 2; i++) {
  twiddleCos[i] = Math.cos((-2 * Math.PI * i) / FFT_SIZE);
  twiddleSin[i] = Math.sin((-2 * Math.PI * i) / FFT_SIZE);
}
const window = Float64Array.from(
  { length: FFT_SIZE },
  (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)),
);

function fft(re, im) {
  for (let i = 0; i < FFT_SIZE; i++) {
    const j = reverse[i];
    if (j > i) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= FFT_SIZE; size <<= 1) {
    const half = size >> 1;
    const step = FFT_SIZE / size;
    for (let start = 0; start < FFT_SIZE; start += size) {
      for (let j = 0; j < half; j++) {
        const c = twiddleCos[j * step];
        const s = twiddleSin[j * step];
        const a = start + j;
        const b = a + half;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

const binOf = (hz) => Math.max(1, Math.round((hz / (SAMPLE_RATE / 2)) * (FFT_SIZE / 2)));

export function spectra(pcm) {
  const frames = Math.max(0, Math.floor((pcm.length - FFT_SIZE) / HOP));
  const bands = BAND_EDGES.map(() => new Float32Array(frames));
  const flux = new Float32Array(frames);
  const [lowFrom, lowTo] = [binOf(BAND_EDGES[0][0]), binOf(BAND_EDGES[0][1])];
  const edges = BAND_EDGES.map(([lo, hi]) => [binOf(lo), binOf(hi)]);

  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  let previous = new Float64Array(lowTo - lowFrom);

  for (let f = 0; f < frames; f++) {
    const offset = f * HOP;
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (pcm[offset + i] ?? 0) * window[i];
      im[i] = 0;
    }
    fft(re, im);

    edges.forEach(([from, to], band) => {
      let sum = 0;
      for (let k = from; k < to; k++) sum += re[k] * re[k] + im[k] * im[k];
      bands[band][f] = Math.sqrt(sum);
    });

    const current = new Float64Array(lowTo - lowFrom);
    let rise = 0;
    for (let k = lowFrom; k < lowTo; k++) {
      const mag = Math.hypot(re[k], im[k]);
      current[k - lowFrom] = mag;
      rise += Math.max(0, mag - previous[k - lowFrom]);
    }
    flux[f] = rise;
    previous = current;
  }
  return { frames, bands, flux };
}

export function normalize(values) {
  const sorted = Float32Array.from(values).sort();
  const ceil = sorted[Math.floor(sorted.length * 0.95)] || 1;
  return Float32Array.from(values, (v) => Math.min(1, v / ceil));
}

function windowStats(flux, from, to) {
  let mean = 0;
  for (let i = from; i < to; i++) mean += flux[i];
  mean /= to - from;
  let variance = 0;
  for (let i = from; i < to; i++) variance += (flux[i] - mean) ** 2;
  return { mean, sd: Math.sqrt(variance / (to - from)) };
}

function isLocalPeak(flux, f) {
  return flux[f] >= flux[f - 1] && flux[f] >= flux[f + 1] && flux[f] >= flux[f - 2] && flux[f] >= flux[f + 2];
}

export function detectOnsets(flux) {
  const span = Math.round(FPS);
  const found = [];
  for (let f = 3; f < flux.length - 3; f++) {
    const { mean, sd } = windowStats(flux, Math.max(0, f - span), Math.min(flux.length, f + span));
    if (!isLocalPeak(flux, f)) continue;
    if (flux[f] <= mean + 1.3 * sd) continue;
    const ms = (f / FPS) * 1000;
    const isNewOnset = !found.length || ms - found.at(-1).ms > 90;
    if (isNewOnset) found.push({ ms, strength: flux[f] });
  }
  return found;
}

export const toBase64 = (values) => Buffer.from(Uint8Array.from(values, (v) => Math.round(v * 255))).toString('base64');
