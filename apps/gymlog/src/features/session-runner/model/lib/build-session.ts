import { getExerciseById } from '@entities/exercise/model/constants';
import type { Routine } from '@entities/routine/model/types';
import {
  INPUT_SOURCE,
  SESSION_STATUS,
  SET_STATUS,
  type ExercisePerformance,
  type SetLog,
  type WorkoutSession,
} from '@entities/session/model/types';
import { getGoalScheme, repsForGoal, type Goal } from '@shared/training';

const FALLBACK_SETS = 3;

// 같은 종목의 직전 세션 마지막 기록 무게(점진적 과부하 시작값 제안, PRD 4.1).
const lastWeightFor = (exerciseId: string, history: WorkoutSession[]): number | null => {
  for (const session of [...history].reverse()) {
    const performance = session.performances.find((item) => item.exerciseId === exerciseId);
    const lastLoggedSet = performance?.sets.filter((set) => set.status !== SET_STATUS.pending).at(-1);
    if (lastLoggedSet) {
      return lastLoggedSet.weight;
    }
  }
  return null;
};

const buildSets = (targetSets: number, targetReps: number, restSec: number, startWeight: number): SetLog[] =>
  Array.from({ length: targetSets }, (_, setIndex) => ({
    setIndex,
    targetReps,
    reps: targetReps,
    weight: startWeight,
    status: SET_STATUS.pending,
    restSec,
    inputSource: INPUT_SOURCE.manual,
  }));

// 사용자 기본 설정(세트 수·휴식)으로 스킴 기본값을 덮는다. 루틴 항목이 직접 지정하면 그게 우선.
type BuildOptions = {
  defaultSets?: number;
  restSec?: number;
};

// 세션 도중 운동 하나를 새로 만들어 붙일 때 사용(목표·프로필 기본값 반영).
export const buildPerformance = (
  exerciseId: string,
  goal: Goal,
  order: number,
  options: BuildOptions = {},
): ExercisePerformance => {
  const scheme = getGoalScheme(goal);
  const targetSets = options.defaultSets ?? FALLBACK_SETS;
  const targetReps = repsForGoal(goal);
  const restSec = options.restSec ?? scheme.restSec;
  return {
    exerciseId,
    order,
    status: 'pending',
    substitutedFrom: null,
    targetSets,
    targetReps,
    restSec,
    startWeight: 0,
    sets: buildSets(targetSets, targetReps, restSec, 0),
  };
};

// 루틴 없이 빈 세션을 시작한다(자유 로깅). 종목은 세션 안에서 검색해 추가한다.
export const buildEmptySession = (goal: Goal): WorkoutSession => ({
  id: crypto.randomUUID(),
  routineId: null,
  routineName: '오늘 운동',
  goal,
  status: SESSION_STATUS.active,
  startedAt: new Date().toISOString(),
  endedAt: null,
  performances: [],
});

export const buildSessionFromRoutine = (
  routine: Routine,
  history: WorkoutSession[] = [],
  options: BuildOptions = {},
): WorkoutSession => {
  const scheme = getGoalScheme(routine.goal);

  const performances: ExercisePerformance[] = [...routine.items]
    .filter((item) => Boolean(getExerciseById(item.exerciseId)))
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const targetSets = item.targetSets ?? options.defaultSets ?? FALLBACK_SETS;
      const targetReps = item.targetReps ?? repsForGoal(routine.goal);
      const restSec = item.restSec ?? options.restSec ?? scheme.restSec;
      const startWeight = item.targetWeight ?? lastWeightFor(item.exerciseId, history) ?? 0;

      return {
        exerciseId: item.exerciseId,
        order: item.order,
        status: 'pending',
        substitutedFrom: null,
        targetSets,
        targetReps,
        restSec,
        startWeight,
        sets: buildSets(targetSets, targetReps, restSec, startWeight),
      } satisfies ExercisePerformance;
    });

  return {
    id: crypto.randomUUID(),
    routineId: routine.id,
    routineName: routine.name,
    goal: routine.goal,
    status: SESSION_STATUS.active,
    startedAt: new Date().toISOString(),
    endedAt: null,
    performances,
  };
};
