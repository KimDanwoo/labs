import { GRID_MIN_CONFIDENCE, findGrid } from './grid.mjs';

/**
 * 격자 탐색 자체 검증. `node scripts/analyze-audio.mjs --selftest`
 * 오디오 없이 도는 유일한 검증 지점이라 여기 둔다 — 격자를 잘못 잡으면 화면이 엉뚱한 박에 뛴다.
 */
const percent = (value) => ((value ?? 0) * 100).toFixed(0);

function check(label, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

function makeSteadyGrid() {
  const jitter = (seed) => ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * 16 - 8;
  return Array.from({ length: 240 }, (_, i) => ({ ms: i * 125 + jitter(i), strength: 1 }));
}

function checkSteadyGrid(grid) {
  const found = findGrid(grid, 30_000);
  const period = found ? 60_000 / found.bpm / found.subdivision : 0;
  check('등간격 격자 복원', !!found && Math.abs(period - 125) / 125 < 0.02, `주기 ${period.toFixed(1)}ms (기대 125ms)`);
  check('신뢰도 높음', !!found && found.confidence > 0.9, `${percent(found?.confidence)}%`);
}

function checkRandomRejected() {
  let seed = 1;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const noise = [];
  for (let ms = 0; ms < 30_000; ms += 90 + random() * 400) noise.push({ ms, strength: 1 });
  const noisy = findGrid(noise, 30_000);
  check(
    '무작위는 격자로 인정 안 됨',
    !noisy || noisy.confidence < GRID_MIN_CONFIDENCE,
    `신뢰도 ${percent(noisy?.confidence)}% < ${GRID_MIN_CONFIDENCE * 100}%`,
  );
}

function checkGapHasNoBeats(grid) {
  const gapped = grid.filter((onset) => onset.ms < 10_000 || onset.ms > 20_000);
  const withGap = findGrid(gapped, 30_000);
  const inGap = withGap?.beats.filter(([ms]) => ms > 11_000 && ms < 19_000).length ?? -1;
  check('쉬는 구간에는 비트를 안 만든다', inGap === 0, `구간 내 ${inGap}개`);
}

export function selftest() {
  const grid = makeSteadyGrid();
  checkSteadyGrid(grid);
  checkRandomRejected();
  checkGapHasNoBeats(grid);
  check('증거 부족이면 null', findGrid(grid.slice(0, 8), 30_000) === null);
}
