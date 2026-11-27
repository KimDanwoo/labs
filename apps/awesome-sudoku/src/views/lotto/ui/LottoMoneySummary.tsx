import { LOTTO_COPY } from '@views/lotto/config/copy';
import { formatSignedPercent, formatWon } from '@views/lotto/lib/format';
import { profitToneOf, returnPerTicketOf } from '@views/lotto/lib/simulationView';
import { returnRateOf, spentOf, wonOf } from '@views/lotto/lib/tally';
import type { Tally } from '@views/lotto/model/types/lotto';
import { LottoStatTile } from '@views/lotto/ui/LottoStatTile';

interface LottoMoneySummaryProps {
  tally: Tally;
}

export function LottoMoneySummary({ tally }: LottoMoneySummaryProps) {
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-3 gap-2">
        <LottoStatTile label={LOTTO_COPY.spent} value={formatWon(spentOf(tally))} />
        <LottoStatTile label={LOTTO_COPY.won} value={formatWon(wonOf(tally))} />
        <LottoStatTile
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
