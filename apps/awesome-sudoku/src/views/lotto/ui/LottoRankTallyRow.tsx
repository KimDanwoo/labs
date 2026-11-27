import { cn } from '@shared/lib/cn';
import { LOTTO_COPY, RANK_LABEL } from '@views/lotto/config/copy';
import { ASSUMED_PRIZE_RANKS, RANK_CONDITION, type LottoRank } from '@views/lotto/config/lotto';
import { TABLE_CELL_CLASS } from '@views/lotto/config/style';
import { formatKoreanUnits, formatOdds } from '@views/lotto/lib/format';
import { observedOddsTextOf } from '@views/lotto/lib/simulationView';
import { theoreticalOddsOf } from '@views/lotto/lib/tally';
import type { Tally } from '@views/lotto/model/types/lotto';

interface LottoRankTallyRowProps {
  rank: LottoRank;
  tally: Tally;
}

export function LottoRankTallyRow({ rank, tally }: LottoRankTallyRowProps) {
  const count = tally.counts[rank];
  const hasHit = count > 0;
  const isAssumed = ASSUMED_PRIZE_RANKS.includes(rank);

  return (
    <tr className={cn(!hasHit && 'text-text-tertiary')}>
      <th scope="row" className={cn(TABLE_CELL_CLASS, 'text-left font-semibold')}>
        {RANK_LABEL[rank]}
        {isAssumed && <sup className="text-text-tertiary">{LOTTO_COPY.assumedMark}</sup>}
        <span className="block text-[11px] font-normal text-text-tertiary break-keep">{RANK_CONDITION[rank]}</span>
      </th>
      <td className={cn(TABLE_CELL_CLASS, 'text-right font-semibold', !hasHit && 'text-text-tertiary')}>
        {LOTTO_COPY.countText(formatKoreanUnits(count))}
      </td>
      <td className={cn(TABLE_CELL_CLASS, 'text-right')}>
        <span className={cn('block', !hasHit && 'text-text-tertiary')}>
          {observedOddsTextOf(tally, rank, LOTTO_COPY.neverHit)}
        </span>
        <span className="block text-[11px] text-text-tertiary">{formatOdds(theoreticalOddsOf(rank))}</span>
      </td>
    </tr>
  );
}
