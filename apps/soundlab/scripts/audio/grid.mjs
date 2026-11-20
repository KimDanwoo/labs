const MS_PER_MINUTE = 60_000;
const MIN_ONSETS = 16;
const ANCHOR_LIMIT = 24;
const BEAT_STRENGTH_MAX = 255;
const BPM_MIN = 60;
const BPM_MAX = 180;
const BPM_STEP = 0.25;
/**
 * 격자 세분. 킥은 박에만 오지 않는다 — 실측: `네온사인`의 온셋 간격이 0.60/0.30/0.15s(4·8·16분음표)였다.
 * 박 간격만 놓고 점수를 내면 16분음표 온셋이 다 빗나가 신뢰도가 실제보다 낮게 나온다.
 */
const SUBDIVISIONS = [1, 2, 4];
/** 격자선 허용 오차. 간격에 비례하되 프레임 양자화(23ms)보다는 넉넉해야 한다. */
const GRID_TOLERANCE_MS = 60;
const GRID_TOLERANCE_MIN_MS = 25;
const GRID_TOLERANCE_RATIO = 0.15;
/** 이 비율 아래면 비트를 내보내지 않는다 — 억지로 켜면 스터터가 된다(PRD §6). */
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
  // 격자가 잘면 아무 온셋이나 우연히 맞는다(180BPM ÷4는 우연 일치율이 60%다).
  // 기대치를 빼고 남는 만큼만 점수로 센다 — 세분이 달라도 값이 비교 가능해진다.
  const chance = Math.min(0.95, (2 * tolerance) / period);

  for (const anchor of onsets.slice(0, ANCHOR_LIMIT)) {
    const matched = countMatches(onsets, anchor, period, tolerance);
    const score = (matched / onsets.length - chance) / (1 - chance);
    if (!best || score > best.score) {
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
  // 세기 0인 격자선은 내보내지 않는다 — 펄스를 안 만들면서 파일만 키운다(실측: 격자선의 66~82%).
  const beats = [];
  for (let ms = best.phase; ms < durationMs; ms += best.period) {
    const near = onsets.find((onset) => Math.abs(onset.ms - ms) <= tolerance);
    if (!near) continue;
    beats.push([Math.round(ms), Math.round((near.strength / peak) * BEAT_STRENGTH_MAX)]);
  }
  return beats;
}

/**
 * 온셋에 가장 잘 맞는 등간격 격자를 찾는다. 온셋을 그대로 파동으로 쓰면 이중 발화·누락이 그대로 보이는데
 * (실측: `장마`에서 90ms 바닥에 43번 붙었다) 격자로 정규화하면 그게 사라진다.
 * 격자에 붙은 온셋 비율이 신뢰도이고, 낮으면 비트를 아예 내보내지 않는다.
 */
export function findGrid(onsets, durationMs) {
  if (onsets.length < MIN_ONSETS) return null;
  const best = searchGrid(onsets);
  if (!best) return null;

  // 신뢰도도 우연 보정된 점수를 쓴다 — 원시 일치율은 잘게 쪼갤수록 부풀려진다.
  const confidence = Math.max(0, best.score);
  return {
    bpm: best.bpm,
    subdivision: best.subdivision,
    confidence,
    beats: gridBeats(onsets, durationMs, best),
  };
}
