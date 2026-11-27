import { cn } from '@shared/lib/cn';
import { LOTTO_COPY, RANK_LABEL } from '@views/lotto/config/copy';
import { ASSUMED_PRIZE_RANKS, RANK_CONDITION, RANK_PRIZE, type LottoRank } from '@views/lotto/config/lotto';
import { TABLE_CELL_CLASS } from '@views/lotto/config/style';
import { formatOdds, formatWon } from '@views/lotto/lib/format';
import { observedOddsTextOf } from '@views/lotto/lib/simulationView';
import { theoreticalOddsOf } from '@views/lotto/lib/tally';
import type { Tally } from '@views/lotto/model/types/lotto';

interface LottoOddsRowProps {
  rank: LottoRank;
  tally: Tally | null;
}

export function LottoOddsRow({ rank, tally }: LottoOddsRowProps) {
  const isAssumedPrize = ASSUMED_PRIZE_RANKS.includes(rank);
  return (
    <tr>
      <th scope="row" className={cn(TABLE_CELL_CLASS, 'text-left')}>
        <span className="block font-semibold">{RANK_LABEL[rank]}</span>
        <span className="block text-[11px] font-normal text-text-tertiary break-keep">{RANK_CONDITION[rank]}</span>
      </th>
      <td className={cn(TABLE_CELL_CLASS, 'text-right')}>
        {formatWon(RANK_PRIZE[rank])}
        {isAssumedPrize && <span className="text-text-tertiary">{LOTTO_COPY.assumedMark}</span>}
      </td>
      <td className={cn(TABLE_CELL_CLASS, 'text-right text-text-secondary')}>{formatOdds(theoreticalOddsOf(rank))}</td>
      <td className={cn(TABLE_CELL_CLASS, 'text-right font-semibold')}>
        {observedOddsTextOf(tally, rank, LOTTO_COPY.neverHit)}
      </td>
    </tr>
  );
}
