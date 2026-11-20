import { summarizeHeatmap } from '@views/my-page/lib/summarizeHeatmap';
import { useProgressStatsContext } from '@views/my-page/model/hooks/useProgressStatsContext';
import { YearHeatmap } from '@views/my-page/ui/progress/YearHeatmap';

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
