import { cn } from '@shared/lib/cn';

import { CELL_KIND } from '../../config/heatmap';
import type { HeatmapCell } from '../../lib/buildYearGrid';
import { heatIntensity } from '../../lib/heatIntensity';
import { styles } from './YearHeatmap.styles';

interface HeatCellProps {
  cell: HeatmapCell;
  maxCount: number;
}

export function HeatCell({ cell, maxCount }: HeatCellProps) {
  if (cell.kind === CELL_KIND.outside) return <div className={styles.outsideCell} />;
  if (cell.kind === CELL_KIND.future) return <div className={styles.futureCell} />;

  return (
    <div
      className={cn(styles.dayCell, styles.heat[heatIntensity(cell.count, maxCount)])}
      title={`${cell.date}: ${cell.count}문제`}
    />
  );
}
