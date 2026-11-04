'use client';
import type { Difficulty } from '@entities/game/model/types';
import { cn } from '@shared/model/utils';
import { memo } from 'react';

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  hard: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  expert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
};
export const DifficultyBadge = memo<{ difficulty: Difficulty; label: string }>(({ difficulty, label }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
      difficultyColors[difficulty],
    )}
  >
    {label}
  </span>
));

DifficultyBadge.displayName = 'DifficultyBadge';
