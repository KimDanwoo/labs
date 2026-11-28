export const WIN_SCORE = 7;

export const GWANG_SCORE = {
  three: 3,
  threeWithRain: 2,
  four: 4,
  five: 15,
} as const;

export const GWANG_SCORE_BY_COUNT: Record<number, number> = {
  3: GWANG_SCORE.three,
  4: GWANG_SCORE.four,
  5: GWANG_SCORE.five,
};

export const YEOL_BASE_COUNT = 5;
export const TTI_BASE_COUNT = 5;
export const PI_BASE_COUNT = 10;

export const GODORI_SCORE = 5;
export const DAN_SCORE = 3;
export const DAN_SET_SIZE = 3;
export const GODORI_SET_SIZE = 3;
export const THREE_GWANG_COUNT = 3;

export const ADDITIVE_GO_LIMIT = 2;

export const PI_BAK_MAX_PI = 7;
export const MEONG_TTA_YEOL_COUNT = 7;
export const BAK_MULTIPLIER = 2;
