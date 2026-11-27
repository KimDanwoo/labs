import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { LOTTO_RANKS } from '@views/lotto/config/lotto';
import { TABLE_HEAD_CELL_CLASS } from '@views/lotto/config/style';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoOddsRow } from '@views/lotto/ui/LottoOddsRow';
import { LottoSection } from '@views/lotto/ui/LottoSection';

export function LottoOdds() {
  const { simulation } = useLottoContext();
  const tally = simulation.result?.tally ?? null;
  return (
    <LottoSection title={LOTTO_COPY.oddsTitle} description={LOTTO_COPY.oddsDescription}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-light">
            <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-left')}>
              {LOTTO_COPY.rankColumn}
            </th>
            <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-right')}>
              {LOTTO_COPY.prizeColumn}
            </th>
            <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-right')}>
              {LOTTO_COPY.theoreticalColumn}
            </th>
            <th scope="col" className={cn(TABLE_HEAD_CELL_CLASS, 'text-right')}>
              {LOTTO_COPY.observedColumn}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light/60">
          {LOTTO_RANKS.map((rank) => (
            <LottoOddsRow key={rank} rank={rank} tally={tally} />
          ))}
        </tbody>
      </table>
      <p className="text-xs leading-relaxed text-text-tertiary break-keep">{LOTTO_COPY.assumedNote}</p>
    </LottoSection>
  );
}
