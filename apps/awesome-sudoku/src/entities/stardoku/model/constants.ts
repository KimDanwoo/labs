export const CELL_MARK = {
  EMPTY: 'empty',
  X: 'x',
  STAR: 'star',
} as const;

export const STAR_ICON = '⭐';
export const X_ICON = '✕';

export const MAX_LIVES = 3;

/** 판당 힌트 개수 — 클리어 점수 = 남은 힌트 (0사용 +3 · 다 쓰면 +0) */
export const MAX_HINTS = 3;
/** 게임 오버(목숨 소진) 감점 — 이전 스테이지로 후퇴 */
export const GAME_OVER_PENALTY = 3;

/**
 * 일반 스테이지 보드 크기 — 스테이지에 따라 단조 증가한다(랜덤 아님).
 * index = min(stage, length) - 1. 기본은 7×7이고 일반 스테이지는 9×9까지 오른다.
 */
export const SIZE_BY_STAGE = [7, 7, 7, 8, 8, 8, 9] as const;
/** 5의 배수 스테이지는 대형판 — 판 크기 상한 */
export const BIG_STAGE_STEP = 5;
export const BIG_BOARD_SIZE = 10;

/**
 * 퍼즐 난이도 = 논리 솔버가 완주에 쓴 최고 티어.
 * EASY: T1(후보 1개 배치)만 — 연쇄 자동 진행 / MEDIUM: T2(줄↔구역 소거) 필요 / HARD: T3(한 수 앞 모순) 필요
 */
export const PUZZLE_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

/**
 * 논리깊이 = T2 라운드 + 3 × T3 라운드. 최고 티어(difficulty)만으로는
 * "T3를 마지막에 한 번 쓴 판"과 "계속 쓴 판"이 동급이 되어 커브를 못 만든다.
 * 3배 가중은 T3(한 수 앞 모순)가 T2보다 확실히 어렵다는 판단 — 깊이 4 = T3 최소 1회.
 */
export const logicDepthScore = (t2Rounds: number, t3Rounds: number): number => t2Rounds + t3Rounds * 3;

/**
 * 스테이지별 최소 논리깊이. index = min(stage, length) - 1.
 * 측정 기반(9×9 평균 생성시간): 1→2.3ms · 2→7.6ms · 4→8.1ms · 5→47.5ms.
 * 깊이 7(T3 2회)은 9×9에서 356ms라 커브에서 제외했다.
 */
export const MIN_LOGIC_DEPTH_BY_STAGE = [2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 5] as const;

/** 1칸 구역 금지 — 공짜 별이 되면 상당수 판이 T1만으로 풀려버린다(측정: T3 필요 비율 31.8%→22.2%) */
export const MIN_REGION_SIZE = 2;

/**
 * 구역 성장 가중 지수(크기^지수). 낮출수록 크기가 고르게 퍼지지만 유일해가 희소해져 생성이 느려진다.
 * 생성은 워커에서 돌고 클리어 연출 1.1초 동안 미리 뽑으므로, 예산 기준은 "p95가 1.1초 안"이다.
 * 판당 생성시간 / 3칸이하 구역 수:
 *   7×7  지수 3 → 2ms·4.8개  |  지수 1.3 →  46ms·2.8개  ← 채택
 *   8×8  지수 3 → 5ms·5.8개  |  지수 1.5 → 100ms·3.9개  ← 채택
 *   9×9  지수 3 → 10ms·6.6개 |  지수 1.8 →  98ms·4.9개  ← 채택
 *
 * 10×10은 지수를 낮춰도 얻는 게 거의 없다(깊이5 기준 p95 / 시도소진 실패율 / 3칸이하):
 *   지수 1.8 → 2092ms · 13.5% · 5.6개   지수 2.0 → 1166ms · 4.5% · 5.7개
 *   지수 2.2 →  630ms ·  0.6% · 6.3개  ← 채택
 * 조각 0.7개를 줄이려고 p95를 3배로 늘리고 난이도가 조용히 낮아지는 판을 13.5%까지 만들 수는 없다.
 * 판이 클수록 2~3칸 조각을 못 줄인다 — 그 조각이 유일해를 만드는 제약이라서다(→ growRegions).
 */
export const REGION_GROWTH_EXPONENT_BY_SIZE: Readonly<Record<number, number>> = {
  7: 1.3,
  8: 1.5,
  9: 1.8,
  10: 2.2,
};
/** 표에 없는 크기의 기본값 */
export const DEFAULT_REGION_GROWTH_EXPONENT = 3;
/** 한 난이도 게이트당 생성 시도 한도. 소진 시 깊이를 1 낮춰 재시도한다 */
export const GENERATION_MAX_ATTEMPTS = 2000;

/**
 * 연속 탭으로 ⭐ 승격을 인정하는 간격. 모바일 위주라 400ms는 빠듯했다 —
 * 10×10에서 셀이 30px대라 조준하느라 두 번째 탭이 늦어지면 ✕가 그냥 지워졌다.
 * 더 늘리면 ✕를 지우려는 단독 탭이 별로 잘못 승격되는 쪽이 늘어난다.
 */
export const DOUBLE_TAP_MS = 500;
/**
 * 이 거리를 넘어야 드래그로 친다. 그 전까지는 탭 후보로 남는다.
 * 10×10을 360px 화면에서 보면 셀이 33px라, 임계값이 없으면 손가락이 굴러 옆 칸에 닿는 것만으로
 * 의도한 탭이 ✕ 페인트로 바뀐다. 8px는 터치 지터보다 크고 셀 크기보다 충분히 작다.
 */
export const DRAG_THRESHOLD_PX = 8;
/** 클리어 연출(별 순차 팝) 길이 — 끝나면 다음 스테이지로 자동 진행 */
export const CLEAR_CELEBRATION_MS = 1100;
/** 별 하나당 팝 지연 — 연출 총 길이가 CLEAR_CELEBRATION_MS를 넘지 않도록 */
export const STAR_POP_STAGGER_MS = 70;

/**
 * 구역 배경색 팔레트 (라이트/다크 쌍) — 색각이상(CVD) 검증 완료.
 * 정상·적록(protan/deutan)·청황(tritan) 시뮬레이션 전부에서 쌍별 Lab ΔE ≥ 11.6(tritan 8.6)을 보장한다.
 * (Machado 2009 행렬 + 배경 블렌딩 기준 — 재생성·재검증: `node scripts/cvd-palette.mjs`)
 * 모든 쌍이 검증됐으므로 어떤 부분집합을 써도 안전하다.
 *
 * **채도 오름차순이 계약이다.** 생성기가 구조적으로 거대 구역 하나를 만들기 때문에(→ generator.ts),
 * 넓은 구역부터 앞쪽 색을 배정한다(regionColorIndexes). 채도가 큰 색은 작은 구역에만 닿으므로
 * 판 전체는 조용하게 유지된다. 순서를 섞으면 이 보정이 깨진다.
 */
export const REGION_COLORS = [
  'bg-stone-300/90 dark:bg-stone-600/75', // 채도 2
  'bg-slate-400/75 dark:bg-slate-600/60', // 채도 14
  'bg-yellow-50/45 dark:bg-yellow-800/30', // 채도 18
  'bg-cyan-200/90 dark:bg-cyan-600/75', // 채도 31
  'bg-lime-300/60 dark:bg-lime-600/30', // 채도 39
  'bg-sky-400/90 dark:bg-sky-600/60', // 채도 41
  'bg-emerald-400/90 dark:bg-emerald-600/60', // 채도 51
  'bg-orange-200/60 dark:bg-orange-800/75', // 채도 54
  'bg-blue-300/75 dark:bg-blue-800/45', // 채도 57
  'bg-amber-300/75 dark:bg-amber-600/60', // 채도 59
] as const;
