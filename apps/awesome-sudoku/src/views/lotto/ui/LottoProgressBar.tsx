import { PERCENT } from '@views/lotto/config/display';
import { progressPercentOf } from '@views/lotto/lib/simulationView';

interface LottoProgressBarProps {
  ratio: number;
  label: string;
}

export function LottoProgressBar({ ratio, label }: LottoProgressBarProps) {
  const percent = progressPercentOf(ratio);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={PERCENT}
      aria-valuenow={percent}
      className="h-2 overflow-hidden rounded-full bg-surface-tertiary"
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-gradient-from to-gradient-to transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
