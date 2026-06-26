import { EXERCISES } from '@entities/exercise/model/constants';
import type { Exercise } from '@entities/exercise/model/types';
import type { Routine, RoutineItem } from '@entities/routine/model/types';
import { MUSCLE_GROUP, VOLUME, type Goal, type MuscleGroup } from '@shared/training';

// 복합 운동을 고립보다 먼저(우선순위), 부위 순서대로 종목을 고른다.
const pickExercisesForMuscle = (muscle: MuscleGroup, perMuscle: number): Exercise[] => {
  const matches = EXERCISES.filter((exercise) => exercise.primaryMuscle === muscle);
  const compounds = matches.filter((exercise) => exercise.movementType === 'compound');
  const isolations = matches.filter((exercise) => exercise.movementType === 'isolation');
  return [...compounds, ...isolations].slice(0, perMuscle);
};

// 부위 목록 → 그 부위 종목들로 구성한 임시 루틴(자동 구성). 세션 시작 시 buildSession이 세트/휴식을 채운다.
export const buildRoutineFromMuscles = (muscles: MuscleGroup[], goal: Goal, id: string): Routine => {
  const picked: string[] = [];
  for (const muscle of muscles) {
    for (const exercise of pickExercisesForMuscle(muscle, VOLUME.perMuscle)) {
      if (!picked.includes(exercise.id)) {
        picked.push(exercise.id);
      }
    }
  }
  const limited = picked.slice(0, VOLUME.maxTotal);
  const items: RoutineItem[] = limited.map((exerciseId, index) => ({ exerciseId, order: index + 1 }));
  const name = muscles.map((muscle) => MUSCLE_GROUP[muscle]).join('·');

  return {
    id,
    name: name || '오늘 운동',
    split: 'custom',
    dayLabel: name,
    goal,
    source: 'custom',
    items,
  };
};
