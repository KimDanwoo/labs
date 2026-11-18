import { DIFFICULTY_VALUES, type Difficulty } from '@entities/question';

export function toDifficulty(value: string | null): Difficulty | undefined {
  return DIFFICULTY_VALUES.find((candidate) => candidate === value);
}
