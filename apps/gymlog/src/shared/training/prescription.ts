import type { Goal } from './goal';
import { getGoalScheme } from './repSchemes';

// 목표가 대표 반복 수를 정한다(근력 5 / 근비대 10 / 근지구력 15 / 파워 3).
export const repsForGoal = (goal: Goal): number => getGoalScheme(goal).reps;

// 자동 구성 시 부위당·총 종목 수(고정). 사용자가 세션에서 자유롭게 빼고/추가/교체한다.
export const VOLUME = { perMuscle: 2, maxTotal: 6 } as const;

export type Prescription = {
  sets: number;
  reps: number;
  restSec: number;
  perMuscle: number;
};

// 선택(목표·세트·휴식)이 실제로 만들어내는 처방.
export const getPrescription = (goal: Goal, sets: number, restSec: number): Prescription => ({
  sets,
  reps: repsForGoal(goal),
  restSec,
  perMuscle: VOLUME.perMuscle,
});

export const formatRestLabel = (restSec: number): string => (restSec >= 60 ? `${restSec / 60}분` : `${restSec}초`);
