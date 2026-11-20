import type { DifficultySpec, SlitherlinkLevel } from '@views/slitherlink/model/types/slitherlink';

export const SLITHERLINK_LEVEL = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const TECHNIQUE = {
  BASIC: 1,
  LOOP: 2,
  TRIAL: 3,
} as const;

export const SLITHERLINK_DIFFICULTY: Record<SlitherlinkLevel, DifficultySpec> = {
  [SLITHERLINK_LEVEL.EASY]: { size: 5, minTechnique: TECHNIQUE.BASIC, maxTechnique: TECHNIQUE.LOOP },
  [SLITHERLINK_LEVEL.MEDIUM]: { size: 7, minTechnique: TECHNIQUE.LOOP, maxTechnique: TECHNIQUE.LOOP },
  [SLITHERLINK_LEVEL.HARD]: { size: 10, minTechnique: TECHNIQUE.TRIAL, maxTechnique: TECHNIQUE.TRIAL },
};

export const REGION_FILL_RATIO = 0.5;

export const TRIAL_STEP_LIMIT = 10;

export const GENERATION_ATTEMPTS = 30;
