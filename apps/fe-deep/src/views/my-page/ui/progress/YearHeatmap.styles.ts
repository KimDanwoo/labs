import type { HeatLevel } from '../../lib/heatIntensity';

export const styles = {
  scroller: 'overflow-x-auto',
  year: 'mb-6',
  yearLabel: 'text-sm font-normal text-muted-foreground mb-2',
  grid: 'flex gap-1 min-w-max',
  dayColumn: 'flex flex-col gap-1 mr-1',
  spacer: 'h-4',
  dayLabel: 'h-3 w-4 text-[10px] text-muted-foreground leading-3 text-right',
  week: 'flex flex-col gap-1',
  monthLabel: 'h-4 text-[10px] text-muted-foreground leading-4 whitespace-nowrap',
  outsideCell: 'h-3 w-3',
  futureCell: 'h-3 w-3 rounded-[2px] bg-muted/40',
  dayCell: 'h-3 w-3 rounded-[2px]',
  heat: {
    0: 'bg-muted',
    1: 'bg-heat-1',
    2: 'bg-heat-2',
    3: 'bg-heat-3',
    4: 'bg-heat-4',
  } satisfies Record<HeatLevel, string>,
} as const;
