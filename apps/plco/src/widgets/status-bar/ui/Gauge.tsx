import { DANGER_THRESHOLD, WARNING_THRESHOLD } from '@shared/constants';

type GaugeProps = {
  value: number;
  max: number;
  color: string;
  icon: string;
};

const GAUGE_LEVEL = { danger: 'danger', warning: 'warning', normal: 'normal' } as const;
type GaugeLevel = (typeof GAUGE_LEVEL)[keyof typeof GAUGE_LEVEL];

/** normal은 호출부가 넘긴 color를 그대로 쓴다. */
const LEVEL_BAR_COLOR: Record<GaugeLevel, string | undefined> = {
  danger: '#EF4444',
  warning: '#F59E0B',
  normal: undefined,
};

const LEVEL_TEXT_CLASS: Record<GaugeLevel, string> = {
  danger: 'text-red-500',
  warning: 'text-amber-500',
  normal: 'text-gray-400',
};

function levelOf(percent: number): GaugeLevel {
  if (percent <= DANGER_THRESHOLD) return GAUGE_LEVEL.danger;
  if (percent <= WARNING_THRESHOLD) return GAUGE_LEVEL.warning;
  return GAUGE_LEVEL.normal;
}

export default function Gauge({ value, max, color, icon }: GaugeProps) {
  const percent = Math.round((value / max) * 100);
  const level = levelOf(percent);
  const isDanger = level === GAUGE_LEVEL.danger;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 text-center">{icon}</span>
      <div className="flex-1 h-2 sm:h-2.5 bg-black/5 rounded-full overflow-hidden">
        <div
          className={`gauge-bar h-full ${isDanger ? 'animate-pulse' : ''}`}
          style={{ width: `${percent}%`, backgroundColor: LEVEL_BAR_COLOR[level] ?? color }}
        />
      </div>
      <span className={`text-[11px] font-bold min-w-[24px] text-right tabular-nums ${LEVEL_TEXT_CLASS[level]}`}>
        {Math.round(value)}
      </span>
    </div>
  );
}
