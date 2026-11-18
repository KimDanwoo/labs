import { DIFFICULTY_CONFIG, DIFFICULTY_VALUES, type Difficulty } from '@entities/question';

export interface DifficultyFilter {
  value: Difficulty | undefined;
  label: string;
}

export const DIFFICULTY_FILTERS: readonly DifficultyFilter[] = [
  { value: undefined, label: '전체' },
  ...DIFFICULTY_VALUES.map((value) => ({ value, label: DIFFICULTY_CONFIG[value].label })),
];
