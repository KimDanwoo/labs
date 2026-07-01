import type { Difficulty } from './types';

export const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'] as const;

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: '쉬움', className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
  medium: { label: '보통', className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' },
  hard: { label: '어려움', className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
};
