import { localDateKey } from '@entities/progress';
import { CELL_KIND, DAYS_PER_WEEK, MONTH_LABELS, YEAR_END, YEAR_START } from '../config/heatmap';

export type HeatmapCell =
  | { kind: typeof CELL_KIND.outside }
  | { kind: typeof CELL_KIND.future }
  | { kind: typeof CELL_KIND.day; date: string; count: number };

export interface YearGrid {
  weeks: HeatmapCell[][];
  monthLabelByWeek: Map<number, string>;
}

function toCell(cursor: Date, start: Date, end: Date, today: Date, heatmap: Record<string, number>): HeatmapCell {
  if (cursor < start || cursor > end) return { kind: CELL_KIND.outside };
  if (cursor > today) return { kind: CELL_KIND.future };
  const date = localDateKey(cursor);
  return { kind: CELL_KIND.day, date, count: heatmap[date] ?? 0 };
}

export function buildYearGrid(year: number, heatmap: Record<string, number>, today: Date): YearGrid {
  const start = new Date(year, YEAR_START.monthIndex, YEAR_START.day);
  const end = new Date(year, YEAR_END.monthIndex, YEAR_END.day);
  const cursor = new Date(start);
  cursor.setDate(start.getDate() - start.getDay());

  const weeks: HeatmapCell[][] = [];
  const monthLabelByWeek = new Map<number, string>();
  const seenMonths = new Set<number>();

  while (cursor <= end) {
    const week: HeatmapCell[] = [];
    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex++) {
      const isInYear = cursor >= start && cursor <= end;
      const month = cursor.getMonth();
      if (isInYear && !seenMonths.has(month)) {
        seenMonths.add(month);
        monthLabelByWeek.set(weeks.length, MONTH_LABELS[month] ?? '');
      }
      week.push(toCell(cursor, start, end, today, heatmap));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, monthLabelByWeek };
}
