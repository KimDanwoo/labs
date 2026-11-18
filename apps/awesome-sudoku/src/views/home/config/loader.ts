export const LOADER_SIZE = {
  sm: { grid: 48, text: 'text-[8px]', gap: 1 },
  md: { grid: 72, text: 'text-[11px]', gap: 1.5 },
  lg: { grid: 96, text: 'text-sm', gap: 2 },
} as const;

export type LoaderSize = keyof typeof LOADER_SIZE;

export const SUDOKU_NUMBERS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const LOADER_DELAY_STEP_S = 0.1;

export const LOADER_GRID_DIVISIONS = 3;
