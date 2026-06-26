import type { Goal } from '@shared/training';

export const SESSION_STATUS = {
  active: 'active',
  done: 'done',
  aborted: 'aborted',
} as const;

export type SessionStatus = keyof typeof SESSION_STATUS;

export const PERFORMANCE_STATUS = {
  pending: 'pending',
  active: 'active',
  done: 'done',
  skipped: 'skipped',
  substituted: 'substituted',
} as const;

export type PerformanceStatus = keyof typeof PERFORMANCE_STATUS;

export const SET_STATUS = {
  pending: 'pending',
  done: 'done',
  partial: 'partial',
  skipped: 'skipped',
} as const;

export type SetStatus = keyof typeof SET_STATUS;

export const WEIGHT_PROGRESSION = {
  increase: '증량',
  maintain: '유지',
} as const;

export type WeightProgression = keyof typeof WEIGHT_PROGRESSION;

export const INPUT_SOURCE = {
  manual: 'manual',
  'auto-button': 'auto-button',
  'auto-voice': 'auto-voice',
  'auto-motion': 'auto-motion',
} as const;

export type InputSource = keyof typeof INPUT_SOURCE;

export type SetLog = {
  setIndex: number;
  targetReps: number;
  reps: number;
  weight: number;
  status: SetStatus;
  restSec: number;
  inputSource: InputSource;
};

export type ExercisePerformance = {
  exerciseId: string;
  order: number;
  status: PerformanceStatus;
  substitutedFrom: string | null;
  targetSets: number;
  targetReps: number;
  restSec: number;
  startWeight: number;
  sets: SetLog[];
};

export type WorkoutSession = {
  id: string;
  routineId: string | null;
  routineName: string;
  goal: Goal;
  status: SessionStatus;
  // ISO 문자열로 저장(직렬화·localStorage 친화).
  startedAt: string;
  endedAt: string | null;
  performances: ExercisePerformance[];
};
