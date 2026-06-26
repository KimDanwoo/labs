import type { Exercise } from '@entities/exercise/model/types';
import type { MuscleGroup } from '@shared/training';

/** 근육 그룹 필터. 'all'이면 전체 반환. */
export const filterExercisesByMuscle = (
  exercises: readonly Exercise[],
  muscle: MuscleGroup | 'all',
): readonly Exercise[] => {
  if (muscle === 'all') return exercises;
  return exercises.filter((ex) => ex.primaryMuscle === muscle);
};
