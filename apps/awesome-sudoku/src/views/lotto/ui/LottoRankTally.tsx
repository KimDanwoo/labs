import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { LOTTO_RANKS } from '@views/lotto/config/lotto';
import { TABLE_HEAD_CELL_CLASS } from '@views/lotto/config/style';
import type { Tally } from '@views/lotto/model/types/lotto';
import { LottoRankTallyRow } from '@views/lotto/ui/LottoRankTallyRow';

interface LottoRankTallyProps {
  tally: Tally;
}

export function LottoRankTally({ tally }: LottoRankTallyProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-text-primary/10">
          <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-left')}>
            {LOTTO_COPY.rankColumn}
          </th>
          <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-right')}>
            {LOTTO_COPY.countColumn}
          </th>
          <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-right')}>
            {LOTTO_COPY.oddsColumn}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-text-primary/6">
        {LOTTO_RANKS.map((rank) => (
          <LottoRankTallyRow key={rank} rank={rank} tally={tally} />
        ))}
      </tbody>
    </table>
  );
}
