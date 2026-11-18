import { cn } from '@shared/lib/cn';

import { CELL_KIND } from '../../config/heatmap';
import type { HeatmapCell } from '../../lib/buildYearGrid';
import { heatIntensity } from '../../lib/heatIntensity';

interface HeatCellProps {
  cell: HeatmapCell;
  maxCount: number;
}

export function HeatCell({ cell, maxCount }: HeatCellProps) {
  if (cell.kind === CELL_KIND.outside) return <div className="h-3 w-3" />;
  if (cell.kind === CELL_KIND.future) return <div className="h-3 w-3 rounded-[2px] bg-muted/40" />;

  return (
    <div
      className={cn(
        'h-3 w-3 rounded-[2px]',
        { 0: 'bg-muted', 1: 'bg-heat-1', 2: 'bg-heat-2', 3: 'bg-heat-3', 4: 'bg-heat-4' }[
          heatIntensity(cell.count, maxCount)
        ],
      )}
      title={`${cell.date}: ${cell.count}문제`}
    />
  );
}
