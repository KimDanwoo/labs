import { DANGER_THRESHOLD, WARNING_THRESHOLD } from '@shared/constants';

type GaugeProps = {
  value: number;
  max: number;
  color: string;
  icon: string;
};

export default function Gauge({ value, max, color, icon }: GaugeProps) {
  const percent = Math.round((value / max) * 100);
  const isDanger = percent <= DANGER_THRESHOLD;
  const isWarning = percent <= WARNING_THRESHOLD && !isDanger;

  const barColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : color;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 text-center">{icon}</span>
      <div className="flex-1 h-2 sm:h-2.5 bg-black/5 rounded-full overflow-hidden">
        <div
          className={`gauge-bar h-full ${isDanger ? 'animate-pulse' : ''}`}
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>
      <span
        className={`text-[11px] font-bold min-w-[24px] text-right tabular-nums ${
          isDanger
            ? 'text-red-500'
            : isWarning
              ? 'text-amber-500'
              : 'text-gray-400'
        }`}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}
