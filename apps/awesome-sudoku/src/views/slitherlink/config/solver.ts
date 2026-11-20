export const SOLVE_STATUS = {
  SOLVED: 'solved',
  STUCK: 'stuck',
  CONTRADICTION: 'contradiction',
} as const;

export const STEP = {
  STABLE: 'stable',
  PROGRESS: 'progress',
  CONTRADICTION: 'contradiction',
  EXHAUSTED: 'exhausted',
} as const;
