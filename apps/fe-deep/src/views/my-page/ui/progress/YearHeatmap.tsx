import { DAY_LABELS } from '@views/my-page/config/heatmap';
import { buildYearGrid } from '@views/my-page/lib/buildYearGrid';
import { HeatCell } from '@views/my-page/ui/progress/HeatCell';

interface YearHeatmapProps {
  year: number;
  heatmap: Record<string, number>;
  maxCount: number;
  today: Date;
}

export function YearHeatmap({ year, heatmap, maxCount, today }: YearHeatmapProps) {
  const { weeks, monthLabelByWeek } = buildYearGrid(year, heatmap, today);

  return (
    <div className="mb-6">
      <p className="text-sm font-normal text-muted-foreground mb-2">{year}년</p>
      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 mr-1">
          <div className="h-4" />
          {DAY_LABELS.map((label, index) => (
            <div key={index} className="h-3 w-4 text-[10px] text-muted-foreground leading-3 text-right">
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            <div className="h-4 text-[10px] text-muted-foreground leading-4 whitespace-nowrap">
              {monthLabelByWeek.get(weekIndex) ?? ''}
            </div>
            {week.map((cell, dayIndex) => (
              <HeatCell key={dayIndex} cell={cell} maxCount={maxCount} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
