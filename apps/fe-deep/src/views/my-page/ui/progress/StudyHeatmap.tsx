import { summarizeHeatmap } from '../../lib/summarizeHeatmap';
import { YearHeatmap } from './YearHeatmap';
import { styles } from './YearHeatmap.styles';

interface StudyHeatmapProps {
  heatmap: Record<string, number>;
}

export function StudyHeatmap({ heatmap }: StudyHeatmapProps) {
  const today = new Date();
  const { maxCount, displayYears } = summarizeHeatmap(heatmap, today.getFullYear());

  return (
    <div className={styles.scroller}>
      {displayYears.map((year) => (
        <YearHeatmap key={year} year={year} heatmap={heatmap} maxCount={maxCount} today={today} />
      ))}
    </div>
  );
}
