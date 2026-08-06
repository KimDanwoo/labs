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

/** 일반 스테이지 보드 크기 랜덤 범위 — 4×4 이하는 자명하거나 해가 없음 */
export const RANDOM_SIZE_MIN = 5;
export const RANDOM_SIZE_MAX = 8;
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

/** 1칸 구역 금지 — 공짜 별이 되어 퍼즐이 시시해진다 (FREE_STAR_FROM_SIZE 미만 보드에 적용) */
export const MIN_REGION_SIZE = 2;
/** 이 크기부터는 1칸 구역(공짜 별)을 정확히 1개 포함 — 시작 엔트리 없이는 못 푼다 */
export const FREE_STAR_FROM_SIZE = 7;
export const GENERATION_MAX_ATTEMPTS = 500;

export const DOUBLE_TAP_MS = 400;
export const WRONG_FLASH_MS = 650;

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
