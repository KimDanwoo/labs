export const GOAL = {
  strength: '근력',
  hypertrophy: '근비대',
  endurance: '근지구력',
  power: '파워',
} as const;

export type Goal = keyof typeof GOAL;
