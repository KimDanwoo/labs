import { Difficulty, DifficultyRange } from "@entities/game/model/types";

export const HINTS_REMAINING = 5;

export const GAME_LEVEL = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
  EXPERT: "expert",
};

export const GAME_MODE = {
  CLASSIC: "classic",
  KILLER: "killer",
};

export const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  [GAME_LEVEL.EASY]: { min: 45, max: 50 }, // 45-50개 셀 제거 (31-36개 힌트)
  [GAME_LEVEL.MEDIUM]: { min: 53, max: 58 }, // 53-58개 셀 제거 (23-28개 힌트)
  [GAME_LEVEL.HARD]: { min: 62, max: 67 }, // 62-67개 셀 제거 (14-19개 힌트)
  [GAME_LEVEL.EXPERT]: { min: 72, max: 77 }, // 72-77개 셀 제거 (4-9개 힌트)
};

export const KILLER_DIFFICULTY_RANGES = {
  [GAME_LEVEL.EASY]: {
    hintsKeep: 15,
    maxCageSize: 3,
  },
  [GAME_LEVEL.MEDIUM]: {
    hintsKeep: 9,
    maxCageSize: 4,
  },
  [GAME_LEVEL.HARD]: {
    hintsKeep: 4,
    maxCageSize: 5,
  },
  [GAME_LEVEL.EXPERT]: {
    hintsKeep: 0,
    maxCageSize: 6,
  },
};

// 킬러 스도쿠 케이지 생성 완료: 29개 케이지
// 킬러 스도쿠: 난이도 hard, 남길 힌트 수: 4, 제거할 셀 수: 77
// 킬러 스도쿠: 목표 제거 수: 77, 실제 제거 수: 61, 최종 힌트 수: 20
// 킬러 스도쿠: 목표로 한 77개 셀 제거 중 61개만 제거 가능했습니다.
// 킬러 스도쿠: 최종 힌트 수: 20
// 킬러 스도쿠 케이지 생성 완료: 28개 케이지
// 킬러 스도쿠: 난이도 expert, 남길 힌트 수: 0, 제거할 셀 수: 81
// 킬러 스도쿠: 목표 제거 수: 81, 실제 제거 수: 59, 최종 힌트 수: 22
// 킬러 스도쿠: 목표로 한 81개 셀 제거 중 59개만 제거 가능했습니다.
// 킬러 스도쿠: 최종 힌트 수: 22

// 일반 스도쿠: 난이도 hard, 제거할 셀 수: 67, 남길 힌트 수: 14
// 일반 스도쿠: 목표 제거 수: 67, 실제 제거 수: 65, 최종 힌트 수: 16
// 일반 스도쿠: 최종 힌트 수: 16
// 일반 스도쿠: 난이도 expert, 제거할 셀 수: 72, 남길 힌트 수: 9
// 일반 스도쿠: 목표 제거 수: 72, 실제 제거 수: 66, 최종 힌트 수: 15
// 일반 스도쿠: 최종 힌트 수: 15
