import { LOTTO_COPY } from '@views/lotto/config/copy';
import { formatPercent, formatTickets } from '@views/lotto/lib/format';
import { phaseOfMode, progressRatioOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoProgressBar } from '@views/lotto/ui/LottoProgressBar';
import { LottoStopButton } from '@views/lotto/ui/LottoStopButton';

export function LottoBulkProgress() {
  const { simulation } = useLottoContext();
  if (phaseOfMode(simulation, 'bulk') !== 'running') return null;
  const ratio = progressRatioOf(simulation);
  const tickets = simulation.result?.tally.tickets ?? 0;
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between text-xs text-text-secondary font-tabular">
        <span>{LOTTO_COPY.progressBought(formatTickets(tickets))}</span>
        <span className="font-semibold text-text-primary">{formatPercent(ratio, 0)}</span>
      </div>
      <LottoProgressBar ratio={ratio} label={LOTTO_COPY.progressLabel} />
      <LottoStopButton />
    </div>
  );
}
