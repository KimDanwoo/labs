const MONTH_LABELS: readonly string[] = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

const DAY_LABELS = ['일', '', '화', '', '목', '', '토'];

function getHeatmapColor(intensity: number): string {
  if (intensity <= 0) return 'bg-muted';
  if (intensity === 1) return 'bg-heat-1';
  if (intensity === 2) return 'bg-heat-2';
  if (intensity === 3) return 'bg-heat-3';
  return 'bg-heat-4';
}

type Cell = { date: string; count: number };

type WeekGrid = { weeks: Cell[][]; monthStartCols: { label: string; col: number }[] };

function buildYearGrid(year: number, heatmap: Record<string, number>, today: Date): WeekGrid {
  const jan1 = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  const cursor = new Date(jan1);
  cursor.setDate(jan1.getDate() - jan1.getDay());

  const weeks: Cell[][] = [];
  const monthStartCols: { label: string; col: number }[] = [];
  const seenMonths = new Set<number>();

  while (cursor <= end) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const inRange = cursor >= jan1 && cursor <= end;
      if (inRange) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const isFuture = cursor > today;
        week.push({ date: isFuture ? '' : key, count: isFuture ? -2 : (heatmap[key] ?? 0) });

        const month = cursor.getMonth();
        if (!seenMonths.has(month)) {
          seenMonths.add(month);
          monthStartCols.push({ label: MONTH_LABELS[month] ?? '', col: weeks.length });
        }
      } else {
        week.push({ date: '', count: -1 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, monthStartCols };
}

interface YearHeatmapProps {
  year: number;
  heatmap: Record<string, number>;
  maxCount: number;
  today: Date;
}
export function YearHeatmap({ year, heatmap, maxCount, today }: YearHeatmapProps) {
  const { weeks, monthStartCols } = buildYearGrid(year, heatmap, today);

  return (
    <div className="mb-6">
      <p className="text-sm font-normal text-muted-foreground mb-2">{year}년</p>
      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 mr-1">
          <div className="h-4" />
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 w-4 text-[10px] text-muted-foreground leading-3 text-right">
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const monthLabel = monthStartCols.find((m) => m.col === wi)?.label ?? '';
          return (
            <div key={wi} className="flex flex-col gap-1">
              <div className="h-4 text-[10px] text-muted-foreground leading-4 whitespace-nowrap">{monthLabel}</div>
              {week.map((day, di) => {
                if (day.count === -1) return <div key={di} className="h-3 w-3" />;
                if (day.count === -2) return <div key={di} className="h-3 w-3 rounded-[2px] bg-muted/40" />;
                const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4);
                return (
                  <div
                    key={di}
                    className={`h-3 w-3 rounded-[2px] ${getHeatmapColor(intensity)}`}
                    title={day.date ? `${day.date}: ${day.count}문제` : ''}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
