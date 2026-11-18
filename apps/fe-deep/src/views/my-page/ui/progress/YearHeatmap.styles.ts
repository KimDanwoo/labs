import type { HeatLevel } from '../../lib/heatIntensity';

export const styles = {
  heat: {
    0: 'bg-muted',
    1: 'bg-heat-1',
    2: 'bg-heat-2',
    3: 'bg-heat-3',
    4: 'bg-heat-4',
  } satisfies Record<HeatLevel, string>,
} as const;
