import type { Equipment } from '../types/exercise';

// 세트마다 "증량"을 선택했을 때 제안할 기본 증량 폭(kg). 기구별 최소 플레이트/스택 단위 기준.
// 어디까지나 제안값 — 사용자는 세트별로 조정한다. 맨몸은 무게 증량 대신 reps/난이도로 올린다.
export const WEIGHT_INCREMENT_KG: Record<Equipment, number> = {
  barbell: 2.5,
  smith: 2.5,
  dumbbell: 2,
  machine: 5,
  cable: 5,
  kettlebell: 4,
  bodyweight: 0,
};

export const getWeightIncrement = (equipment: Equipment): number => WEIGHT_INCREMENT_KG[equipment];
