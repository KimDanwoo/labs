const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const DAY_LABELS = ['일', '', '화', '', '목', '', '토'];

/** 강도(0~4)를 히트맵 색상 클래스로 변환한다. */
function getHeatmapColor(intensity: number): string {
  if (intensity <= 0) return 'bg-muted';
  if (intensity === 1) return 'bg-green-200 dark:bg-green-900';
  if (intensity === 2) return 'bg-green-300 dark:bg-green-700';
  if (intensity === 3) return 'bg-green-500 dark:bg-green-500';
  return 'bg-green-600 dark:bg-green-400';
}

type Cell = { date: string; count: number };
type WeekGrid = { weeks: Cell[][]; monthStartCols: { label: string; col: number }[] };

/** 해당 연도의 주 단위 그리드와 월 시작 열 인덱스를 생성한다. */
function buildYearGrid(year: number, heatmap: Record<string, number>, today: Date): WeekGrid {
  const jan1 = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  // Jan 1이 속한 주의 일요일부터 시작
  const cursor = new Date(jan1);
  cursor.setDate(jan1.getDate() - jan1.getDay());

  const weeks: Cell[][] = [];
  const monthStartCols: { label: string; col: number }[] = [];
  let seenMonths = new Set<number>();

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
          monthStartCols.push({ label: MONTH_LABELS[month], col: weeks.length });
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

function YearHeatmap({ year, heatmap, maxCount, today }: YearHeatmapProps) {
  const { weeks, monthStartCols } = buildYearGrid(year, heatmap, today);

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-muted-foreground mb-2">{year}년</p>
      <div className="flex gap-1 min-w-max">
        {/* 요일 레이블 */}
        <div className="flex flex-col gap-1 mr-1">
          <div className="h-4" />
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 w-4 text-[10px] text-muted-foreground leading-3 text-right">
              {label}
            </div>
          ))}
        </div>

        {/* 주 열 */}
        {weeks.map((week, wi) => {
          const monthLabel = monthStartCols.find((m) => m.col === wi)?.label ?? '';
          return (
            <div key={wi} className="flex flex-col gap-1">
              <div className="h-4 text-[10px] text-muted-foreground leading-4 whitespace-nowrap">
                {monthLabel}
              </div>
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

/** 연도별 1월~12월 학습 히트맵을 표시한다. */
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
        <YearHeatmap
          key={year}
          year={year}
          heatmap={heatmap}
          maxCount={maxCount}
          today={today}
        />
      ))}
    </div>
  );
}
