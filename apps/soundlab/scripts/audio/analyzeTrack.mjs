import { FPS, SAMPLE_RATE, decodeMono, detectOnsets, normalize, spectra, toBase64 } from './dsp.mjs';
import { GRID_MIN_CONFIDENCE, findGrid } from './grid.mjs';

const MASTER_DRIFT_MS = 250;
const MS_PER_SECOND = 1000;

function buildPayload({ track, audioMs, bands, accepted }) {
  const [low, mid, high] = bands.map(normalize);
  return {
    id: track.id,
    fps: Number(FPS.toFixed(4)),
    audioMs: Math.round(audioMs),
    low: toBase64(low),
    mid: toBase64(mid),
    high: toBase64(high),
    bpm: accepted?.bpm ?? null,
    beats: accepted?.beats ?? [],
  };
}

function buildReport({ track, audioMs, frames, onsets, grid, accepted }) {
  return {
    frames,
    audioMs,
    onsets: onsets.length,
    bpm: grid?.bpm ?? null,
    subdivision: grid?.subdivision ?? 1,
    confidence: grid?.confidence ?? 0,
    beats: accepted?.beats.length ?? 0,
    drift: Math.round(audioMs - track.durationMs),
  };
}

export function analyze(file, track) {
  const pcm = decodeMono(file);
  const audioMs = (pcm.length / SAMPLE_RATE) * MS_PER_SECOND;
  const drift = audioMs - track.durationMs;
  if (Math.abs(drift) > MASTER_DRIFT_MS) {
    return { mismatch: Math.round(drift) };
  }
  const { frames, bands, flux } = spectra(pcm);
  if (frames === 0) throw new Error('프레임이 없습니다(너무 짧은 파일)');

  const onsets = detectOnsets(flux);
  const grid = findGrid(onsets, audioMs);
  const isConfidentGrid = grid && grid.confidence >= GRID_MIN_CONFIDENCE;
  const accepted = isConfidentGrid ? grid : null;

  return {
    payload: buildPayload({ track, audioMs, bands, accepted }),
    report: buildReport({ track, audioMs, frames, onsets, grid, accepted }),
  };
}
