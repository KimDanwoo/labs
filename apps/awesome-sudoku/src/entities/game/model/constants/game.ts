import type { ClassicDifficultySpec, Difficulty, KillerDifficultySpec } from '@entities/game/model/types';

export const HINTS_REMAINING = 3;

export const GAME_LEVEL = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export const GAME_LEVEL_LABELS = {
  [GAME_LEVEL.EASY]: '쉬움',
  [GAME_LEVEL.MEDIUM]: '중간',
  [GAME_LEVEL.HARD]: '어려움',
  [GAME_LEVEL.EXPERT]: '전문가',
} as const;

export const GAME_MODE = {
  CLASSIC: 'classic',
  KILLER: 'killer',
} as const;

/** 퍼즐을 푸는 데 필요한 사람 기법 단계. 숫자가 클수록 어렵다. */
export const TECHNIQUE = {
  /** 네이키드·히든 싱글만으로 풀림 */
  SINGLE: 1,
  /** 락드 캔디데이트(pointing/claiming) 필요 */
  LOCKED: 2,
  /** 서브셋(네이키드·히든 페어/트리플) 필요 */
  SUBSET: 3,
  /** 피시(X-Wing·Swordfish)·XY-Wing 필요 */
  ADVANCED: 4,
  /** 위 기법으로 안 풀림 — 추측(시행착오) 필요 */
  GUESS: 5,
} as const;

/**
 * 클래식: 남기는 힌트 수 + 허용 기법 범위. 힌트 수만으로는 난이도가 갈리지 않아
 * (무작위 제거는 22~28칸에서 멈춘다) 채점 결과가 범위를 벗어나면 다시 뽑는다.
 * expert도 ADVANCED(피시·윙·컬러링)까지만 허용해 추측 없이 풀리는 판을 보장한다.
 * 유일해 이론 최소는 17칸이라 그 아래는 목표로 두지 않는다.
 */
export const CLASSIC_DIFFICULTY: Record<Difficulty, ClassicDifficultySpec> = {
  [GAME_LEVEL.EASY]: { clues: 40, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.SINGLE },
  [GAME_LEVEL.MEDIUM]: { clues: 30, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.LOCKED },
  [GAME_LEVEL.HARD]: { clues: 27, minTechnique: TECHNIQUE.LOCKED, maxTechnique: TECHNIQUE.SUBSET },
  [GAME_LEVEL.EXPERT]: { clues: 23, minTechnique: TECHNIQUE.ADVANCED, maxTechnique: TECHNIQUE.ADVANCED },
};

/**
 * 킬러: 케이지 합 제약이 있어 힌트를 훨씬 적게 남기고, 케이지가 클수록 조합이 많아 어렵다.
 * 기법 범위는 주로 "추측이 필요한 판 거부"용이다 — 케이지 조합·45규칙으로 대부분 SINGLE/LOCKED에서 풀린다.
 */
export const KILLER_DIFFICULTY: Record<Difficulty, KillerDifficultySpec> = {
  [GAME_LEVEL.EASY]: { clues: 24, maxCageSize: 3, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.SINGLE },
  [GAME_LEVEL.MEDIUM]: { clues: 14, maxCageSize: 4, minTechnique: TECHNIQUE.SINGLE, maxTechnique: TECHNIQUE.LOCKED },
  [GAME_LEVEL.HARD]: { clues: 6, maxCageSize: 4, minTechnique: TECHNIQUE.LOCKED, maxTechnique: TECHNIQUE.SUBSET },
  [GAME_LEVEL.EXPERT]: { clues: 0, maxCageSize: 5, minTechnique: TECHNIQUE.LOCKED, maxTechnique: TECHNIQUE.ADVANCED },
};

/** 최대 실수 허용 횟수 (초과 시 게임 오버) */
export const MAX_MISTAKES = 5;
