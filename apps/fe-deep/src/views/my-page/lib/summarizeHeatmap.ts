import { DATE_KEY_YEAR_LENGTH } from '@views/my-page/config/heatmap';

export function summarizeHeatmap(heatmap: Record<string, number>, currentYear: number) {
  const maxCount = Math.max(1, ...Object.values(heatmap));
  const years = Object.keys(heatmap).map((dateKey) => Number(dateKey.slice(0, DATE_KEY_YEAR_LENGTH)));
  const minYear = years.length > 0 ? Math.min(...years) : currentYear;
  const displayYears = Array.from({ length: currentYear - minYear + 1 }, (_, offset) => currentYear - offset);
  return { maxCount, displayYears };
}
