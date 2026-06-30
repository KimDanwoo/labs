import type { Goal } from './goal';

export type GoalScheme = {
  // 목표별 대표 반복 수와 권장 휴식(초). 난이도는 쓰지 않는다 — 세트수·종목수는 사용자가 직접 조절.
  readonly reps: number;
  readonly restSec: number;
};

// 목표 → 반복·휴식. "근력=저반복 긴휴식 / 근비대=중반복 / 근지구력=고반복 짧은휴식"의 교과서적 매칭.
export const GOAL_SCHEME: Record<Goal, GoalScheme> = {
  strength: { reps: 5, restSec: 180 },
  hypertrophy: { reps: 10, restSec: 90 },
  endurance: { reps: 15, restSec: 45 },
  power: { reps: 3, restSec: 180 },
};

export const getGoalScheme = (goal: Goal): GoalScheme => GOAL_SCHEME[goal];
