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
 * index = min(stage, length) - 1. 4×4 이하는 자명하거나 해가 없어서 5부터.
 */
export const SIZE_BY_STAGE = [5, 5, 6, 6, 7, 7, 8] as const;
/** 5의 배수 스테이지는 대형판 */
export const BIG_STAGE_STEP = 5;
export const BIG_BOARD_SIZE = 9;

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
export const MIN_LOGIC_DEPTH_BY_STAGE = [1, 1, 2, 2, 2, 4, 4, 4, 4, 4, 4, 5] as const;

/** 1칸 구역 금지 — 공짜 별이 되면 상당수 판이 T1만으로 풀려버린다(측정: T3 필요 비율 31.8%→22.2%) */
export const MIN_REGION_SIZE = 2;
/** 한 난이도 게이트당 생성 시도 한도. 소진 시 깊이를 1 낮춰 재시도한다 */
export const GENERATION_MAX_ATTEMPTS = 2000;

export const DOUBLE_TAP_MS = 400;
/** 클리어 연출(별 순차 팝) 길이 — 끝나면 다음 스테이지로 자동 진행 */
export const CLEAR_CELEBRATION_MS = 1100;
/** 별 하나당 팝 지연 — 연출 총 길이가 CLEAR_CELEBRATION_MS를 넘지 않도록 */
export const STAR_POP_STAGGER_MS = 70;

/**
 * 구역 배경색 팔레트 (라이트/다크 쌍) — 색각이상(CVD) 검증 완료.
 * hue만이 아니라 음영(100↔400) 명도 차이 + 중성 회색을 제2 식별축으로 사용해,
 * 정상·적록(protan/deutan)·청황(tritan) 시뮬레이션 전부에서 쌍별 Lab ΔE ≥ 12.5(tritan 8.8)를 보장한다.
 * (Machado 2009 행렬 + 배경 블렌딩 기준 — 재검증: `node scripts/cvd-palette.mjs`)
 * 모든 쌍이 검증됐으므로 어떤 부분집합을 써도 안전하다.
 */
export const REGION_COLORS = [
  'bg-sky-400/75 dark:bg-sky-600/60',
  'bg-amber-200/75 dark:bg-amber-700/45',
  'bg-emerald-400/75 dark:bg-emerald-700/45',
  'bg-violet-200/75 dark:bg-violet-600/45',
  'bg-orange-400/75 dark:bg-orange-600/75',
  'bg-teal-100/75 dark:bg-teal-900/45',
  'bg-slate-400/75 dark:bg-slate-600/75',
  'bg-lime-100/75 dark:bg-lime-600/60',
  'bg-yellow-400/75 dark:bg-yellow-900/45',
] as const;
