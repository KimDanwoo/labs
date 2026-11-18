import { DAY_LABELS } from '../../config/heatmap';
import { buildYearGrid } from '../../lib/buildYearGrid';
import { HeatCell } from './HeatCell';
import { styles } from './YearHeatmap.styles';

interface YearHeatmapProps {
  year: number;
  heatmap: Record<string, number>;
  maxCount: number;
  today: Date;
}

export function YearHeatmap({ year, heatmap, maxCount, today }: YearHeatmapProps) {
  const { weeks, monthLabelByWeek } = buildYearGrid(year, heatmap, today);

  return (
    <div className={styles.year}>
      <p className={styles.yearLabel}>{year}년</p>
      <div className={styles.grid}>
        <div className={styles.dayColumn}>
          <div className={styles.spacer} />
          {DAY_LABELS.map((label, index) => (
            <div key={index} className={styles.dayLabel}>
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className={styles.week}>
            <div className={styles.monthLabel}>{monthLabelByWeek.get(weekIndex) ?? ''}</div>
            {week.map((cell, dayIndex) => (
              <HeatCell key={dayIndex} cell={cell} maxCount={maxCount} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
