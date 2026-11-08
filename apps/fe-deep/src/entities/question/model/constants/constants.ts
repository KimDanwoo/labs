import type { Difficulty } from '@entities/question/model/types';
import type { BadgeVariant } from '@ui/react';

export const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'] as const;

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; variant: BadgeVariant }> = {
  easy: { label: '쉬움', variant: 'success' },
  medium: { label: '보통', variant: 'warning' },
  hard: { label: '어려움', variant: 'error' },
};
