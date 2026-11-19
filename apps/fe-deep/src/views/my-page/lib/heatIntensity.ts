import { HEAT_LEVEL_COUNT } from '../config/heatmap';

type HeatLevel = 0 | 1 | 2 | 3 | 4;

export function heatIntensity(count: number, maxCount: number): HeatLevel {
  if (count <= 0) return 0;
  const level = Math.ceil((count / maxCount) * HEAT_LEVEL_COUNT);
  return Math.min(Math.max(level, 1), HEAT_LEVEL_COUNT) as HeatLevel;
}
