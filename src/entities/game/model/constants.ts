import { Difficulty, DifficultyRange } from "@entities/game/model/types";

export const HINTS_REMAINING = 5;

export const GAME_LEVEL = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
  EXPERT: "expert",
} as const;

export const GAME_MODE = {
  CLASSIC: "classic",
  KILLER: "killer",
} as const;

// 개선된 난이도별 힌트 개수 설정 (더 정확한 범위)
export const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  [GAME_LEVEL.EASY]: { min: 36, max: 42 }, // 36-42개 힌트 (39-45개 제거)
  [GAME_LEVEL.MEDIUM]: { min: 28, max: 34 }, // 28-34개 힌트 (47-53개 제거)
  [GAME_LEVEL.HARD]: { min: 20, max: 26 }, // 20-26개 힌트 (55-61개 제거)
  [GAME_LEVEL.EXPERT]: { min: 15, max: 19 }, // 15-19개 힌트 (62-66개 제거)
};

// 킬러 스도쿠 난이도별 설정 (개선된 버전)
export const KILLER_DIFFICULTY_RANGES = {
  [GAME_LEVEL.EASY]: {
    hintsKeep: 25, // 25개 힌트 유지
    maxCageSize: 3,
  },
  [GAME_LEVEL.MEDIUM]: {
    hintsKeep: 18, // 18개 힌트 유지
    maxCageSize: 4,
  },
  [GAME_LEVEL.HARD]: {
    hintsKeep: 12, // 12개 힌트 유지
    maxCageSize: 5,
  },
  [GAME_LEVEL.EXPERT]: {
    hintsKeep: 8, // 8개 힌트 유지 (0개에서 변경)
    maxCageSize: 6,
  },
};

// 난이도별 설명 추가
export const DIFFICULTY_DESCRIPTIONS = {
  [GAME_LEVEL.EASY]: "초보자용 - 많은 힌트와 작은 케이지",
  [GAME_LEVEL.MEDIUM]: "중급자용 - 적당한 힌트와 보통 케이지",
  [GAME_LEVEL.HARD]: "고급자용 - 적은 힌트와 큰 케이지",
  [GAME_LEVEL.EXPERT]: "전문가용 - 최소 힌트와 최대 케이지",
} as const;

// 게임 통계를 위한 목표 시간 (초)
export const TARGET_TIMES = {
  [GAME_LEVEL.EASY]: 600, // 10분
  [GAME_LEVEL.MEDIUM]: 900, // 15분
  [GAME_LEVEL.HARD]: 1200, // 20분
  [GAME_LEVEL.EXPERT]: 1800, // 30분
} as const;
