import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { TILE_CLASS } from '@views/lotto/config/style';
import { formatSignedPercent, formatWon } from '@views/lotto/lib/format';
import { profitToneOf, returnPerTicketOf } from '@views/lotto/lib/simulationView';
import { returnRateOf, spentOf, wonOf } from '@views/lotto/lib/tally';
import type { Tally } from '@views/lotto/model/types/lotto';
import { LottoStatRow } from '@views/lotto/ui/LottoStatRow';

interface LottoMoneySummaryProps {
  tally: Tally;
}

export function LottoMoneySummary({ tally }: LottoMoneySummaryProps) {
  return (
    <div className="flex flex-col gap-2">
      <dl className={cn('divide-y divide-text-primary/6 px-4', TILE_CLASS)}>
        <LottoStatRow label={LOTTO_COPY.spent} value={formatWon(spentOf(tally))} />
        <LottoStatRow label={LOTTO_COPY.won} value={formatWon(wonOf(tally))} />
        <LottoStatRow
          label={LOTTO_COPY.profitRate}
          value={formatSignedPercent(returnRateOf(tally) - 1)}
          tone={profitToneOf(tally)}
        />
      </dl>
      <p className="text-xs text-text-secondary break-keep">
        {LOTTO_COPY.returnNote(formatWon(returnPerTicketOf(tally)))}
      </p>
    </div>
  );
}
