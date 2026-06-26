import type { MuscleGroup } from '@shared/training';

export const EQUIPMENT = {
  barbell: '바벨',
  dumbbell: '덤벨',
  machine: '머신',
  cable: '케이블',
  smith: '스미스머신',
  kettlebell: '케틀벨',
  bodyweight: '맨몸',
} as const;

export type Equipment = keyof typeof EQUIPMENT;

export const MOVEMENT_TYPE = {
  compound: '복합',
  isolation: '고립',
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPE;

export type Exercise = {
  readonly id: string;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly primaryMuscle: MuscleGroup;
  readonly secondaryMuscles: readonly MuscleGroup[];
  readonly equipment: Equipment;
  readonly movementType: MovementType;
  // 기구가 없거나 차 있을 때 제안할 같은 부위 대체 종목. 모두 EXERCISES에 존재하는 id여야 한다.
  readonly alternativeIds: readonly string[];
};
