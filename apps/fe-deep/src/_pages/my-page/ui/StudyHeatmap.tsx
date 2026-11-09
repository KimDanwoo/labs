import { YearHeatmap } from './YearHeatmap';

export function StudyHeatmap({ heatmap }: { heatmap: Record<string, number> }) {
  const today = new Date();
  const currentYear = today.getFullYear();

  let maxCount = 1;
  for (const v of Object.values(heatmap)) {
    if (v > maxCount) maxCount = v;
  }

  // 데이터가 존재하는 가장 오래된 연도 파악
  const years = Object.keys(heatmap).map((d) => Number(d.slice(0, 4)));
  const minYear = years.length > 0 ? Math.min(...years) : currentYear;

  const displayYears: number[] = [];
  for (let y = currentYear; y >= minYear; y--) {
    displayYears.push(y);
  }

  return (
    <div className="overflow-x-auto">
      {displayYears.map((year) => (
        <YearHeatmap key={year} year={year} heatmap={heatmap} maxCount={maxCount} today={today} />
      ))}
    </div>
  );
}
