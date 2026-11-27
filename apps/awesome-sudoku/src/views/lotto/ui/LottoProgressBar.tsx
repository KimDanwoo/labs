import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { PERCENT } from '@views/lotto/config/display';
import { PROGRESS_SWEEP_CLASS } from '@views/lotto/config/style';
import { progressPercentOf, progressRatioOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoProgressBar() {
  const { simulation } = useLottoContext();
  const isBulk = simulation.request?.mode === 'bulk';
  const percent = progressPercentOf(progressRatioOf(simulation));

  return (
    <span
      role="progressbar"
      aria-label={isBulk ? LOTTO_COPY.bulkProgress : LOTTO_COPY.jackpotProgress}
      aria-valuemin={0}
      aria-valuemax={PERCENT}
      aria-valuenow={isBulk ? percent : undefined}
      className="absolute inset-x-0 bottom-0 block h-[3px] overflow-hidden bg-ink/10"
    >
      <span
        className={cn(
          'block h-full rounded-full bg-ink transition-[width] duration-300 ease-out',
          !isBulk && 'w-2/5',
          !isBulk && PROGRESS_SWEEP_CLASS,
        )}
        style={isBulk ? { width: `${percent}%` } : undefined}
      />
    </span>
  );
}
