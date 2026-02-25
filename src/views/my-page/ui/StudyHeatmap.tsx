/** 강도(0~4)를 히트맵 색상 클래스로 변환한다. */
function getHeatmapColor(intensity: number): string {
  switch (intensity) {
    case 0: return 'bg-muted';
    case 1: return 'bg-green-200 dark:bg-green-900';
    case 2: return 'bg-green-300 dark:bg-green-700';
    case 3: return 'bg-green-500 dark:bg-green-500';
    case 4: return 'bg-green-600 dark:bg-green-400';
    default: return 'bg-muted';
  }
}

/** 최근 15주(~105일)의 학습 히트맵을 GitHub 잔디 스타일로 표시한다. */
export function StudyHeatmap({ heatmap }: { heatmap: Record<string, number> }) {
  const weeks = 15;
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun

  // 히트맵 최대값 (색상 강도 계산용). 스프레드 대신 루프로 stack overflow 방지.
  let maxCount = 1;
  for (const v of Object.values(heatmap)) {
    if (v > maxCount) maxCount = v;
  }

  // 주 단위로 날짜 그리드 생성 (일요일 시작)
  const grid: { date: string; count: number }[][] = [];

  // 마지막 열(이번 주)의 시작일부터 역산
  const totalDays = (weeks - 1) * 7 + dayOfWeek + 1;
  const currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - totalDays + 1);

  for (let w = 0; w < weeks; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      if (w === weeks - 1 && d > dayOfWeek) {
        week.push({ date: '', count: -1 });
      } else {
        const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        week.push({ date: key, count: heatmap[key] ?? 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    grid.push(week);
  }

  const dayLabels = ['일', '', '화', '', '목', '', '토'];

  return (
    <div className="flex gap-1">
      <div className="flex flex-col gap-1 mr-1 pt-0">
        {dayLabels.map((label, i) => (
          <div key={i} className="h-3 w-4 text-[10px] text-muted-foreground leading-3 text-right">
            {label}
          </div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => {
            if (day.count < 0) {
              return <div key={di} className="h-3 w-3" />;
            }
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
      ))}
    </div>
  );
}
