import type { Goal, Split } from '@shared/training';

export const ROUTINE_SOURCE = {
  preset: 'preset',
  custom: 'custom',
  group: 'group',
} as const;

export type RoutineSource = keyof typeof ROUTINE_SOURCE;

export type RoutineItem = {
  // exercise 엔티티의 id 문자열(FSD cross-import 금지로 ExerciseId 타입을 직접 참조하지 않는다).
  readonly exerciseId: string;
  readonly order: number;
  // 비우면 루틴 goal의 기본값(GOAL_SCHEME)과 프로필 설정을 따른다(상위 레이어에서 해석).
  readonly targetSets?: number;
  readonly targetReps?: number;
  readonly targetWeight?: number;
  readonly restSec?: number;
};

export type Routine = {
  readonly id: string;
  readonly name: string;
  readonly split: Split;
  readonly dayLabel: string;
  readonly goal: Goal;
  readonly source: RoutineSource;
  readonly items: readonly RoutineItem[];
};
