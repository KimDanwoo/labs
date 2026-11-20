import { summarizeHeatmap } from '../../lib/summarizeHeatmap';
import { useProgressStatsContext } from '../../model/hooks/useProgressStatsContext';
import { YearHeatmap } from './YearHeatmap';

export function StudyHeatmap() {
  const { heatmap } = useProgressStatsContext();
  const today = new Date();
  const { maxCount, displayYears } = summarizeHeatmap(heatmap, today.getFullYear());

  return (
    <div className="overflow-x-auto">
      {displayYears.map((year) => (
        <YearHeatmap key={year} year={year} heatmap={heatmap} maxCount={maxCount} today={today} />
      ))}
    </div>
  );
}
