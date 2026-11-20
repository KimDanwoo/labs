const MS_PER_MINUTE = 60_000;
const MIN_ONSETS = 16;
const ANCHOR_LIMIT = 24;
const BEAT_STRENGTH_MAX = 255;
const BPM_MIN = 60;
const BPM_MAX = 180;
const BPM_STEP = 0.25;
const SUBDIVISIONS = [1, 2, 4];
const GRID_TOLERANCE_MS = 60;
const GRID_TOLERANCE_MIN_MS = 25;
const GRID_TOLERANCE_RATIO = 0.15;
export const GRID_MIN_CONFIDENCE = 0.75;

function countMatches(onsets, anchor, period, tolerance) {
  let matched = 0;
  for (const onset of onsets) {
    const offset = (((onset.ms - anchor.ms) % period) + period) % period;
    if (Math.min(offset, period - offset) <= tolerance) matched++;
  }
  return matched;
}

function toleranceFor(period) {
  return Math.min(GRID_TOLERANCE_MS, Math.max(GRID_TOLERANCE_MIN_MS, period * GRID_TOLERANCE_RATIO));
}

function bestForSubdivision(onsets, bpm, subdivision, current) {
  let best = current;
  const period = MS_PER_MINUTE / bpm / subdivision;
  const tolerance = toleranceFor(period);
  const chance = Math.min(0.95, (2 * tolerance) / period);

  for (const anchor of onsets.slice(0, ANCHOR_LIMIT)) {
    const matched = countMatches(onsets, anchor, period, tolerance);
    const score = (matched / onsets.length - chance) / (1 - chance);
    const isBetterScore = !best || score > best.score;
    if (isBetterScore) {
      best = { bpm, subdivision, period, phase: anchor.ms % period, matched, score };
    }
  }
  return best;
}

function searchGrid(onsets) {
  let best = null;
  for (let bpm = BPM_MIN; bpm <= BPM_MAX; bpm += BPM_STEP) {
    for (const subdivision of SUBDIVISIONS) best = bestForSubdivision(onsets, bpm, subdivision, best);
  }
  return best;
}

function gridBeats(onsets, durationMs, best) {
  const tolerance = toleranceFor(best.period);
  const peak = Math.max(...onsets.map((onset) => onset.strength)) || 1;
  const beats = [];
  for (let ms = best.phase; ms < durationMs; ms += best.period) {
    const near = onsets.find((onset) => Math.abs(onset.ms - ms) <= tolerance);
    if (!near) continue;
    beats.push([Math.round(ms), Math.round((near.strength / peak) * BEAT_STRENGTH_MAX)]);
  }
  return beats;
}

export function findGrid(onsets, durationMs) {
  if (onsets.length < MIN_ONSETS) return null;
  const best = searchGrid(onsets);
  if (!best) return null;

  const confidence = Math.max(0, best.score);
  return {
    bpm: best.bpm,
    subdivision: best.subdivision,
    confidence,
    beats: gridBeats(onsets, durationMs, best),
  };
}
