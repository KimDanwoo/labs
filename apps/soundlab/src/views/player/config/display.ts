export const TRACK_NUMBER_DIGITS = 2;

export const GENRE_DOT_COLOR = { saturation: '42%', lightness: '56%' } as const;

export const LEVEL_BAR_TRANSFORMS: readonly string[] = [
  'scaleY(calc(0.364 + var(--lv, 0) * 0.636))',
  'scaleY(calc(0.636 + var(--lv, 0) * 0.364))',
  'scaleY(calc(0.455 + var(--lv, 0) * 0.545))',
];

export const LEVEL_PRECISION = 3;
