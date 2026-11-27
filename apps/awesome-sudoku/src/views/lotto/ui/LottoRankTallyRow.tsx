import { cn } from '@shared/lib/cn';
import { LOTTO_COPY, RANK_LABEL } from '@views/lotto/config/copy';
import { RANK_PRIZE, type LottoRank } from '@views/lotto/config/lotto';
import { TABLE_CELL_CLASS } from '@views/lotto/config/style';
import { formatKoreanUnits, formatWon } from '@views/lotto/lib/format';

interface LottoRankTallyRowProps {
  rank: LottoRank;
  count: number;
}

export function LottoRankTallyRow({ rank, count }: LottoRankTallyRowProps) {
  const hasHit = count > 0;
  return (
    <tr className={cn(!hasHit && 'text-text-tertiary')}>
      <th scope="row" className={cn(TABLE_CELL_CLASS, 'text-left font-semibold')}>
        {RANK_LABEL[rank]}
      </th>
      <td className={cn(TABLE_CELL_CLASS, 'text-right', !hasHit && 'text-text-tertiary')}>
        {LOTTO_COPY.countText(formatKoreanUnits(count))}
      </td>
      <td className={cn(TABLE_CELL_CLASS, 'text-right', !hasHit && 'text-text-tertiary')}>
        {formatWon(count * RANK_PRIZE[rank])}
      </td>
    </tr>
  );
}
