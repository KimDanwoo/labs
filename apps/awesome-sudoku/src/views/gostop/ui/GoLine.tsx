import { GOSTOP_COPY, RESULT_COPY } from '@views/gostop/config/copy';
import { goBonusOf } from '@views/gostop/lib/goBonus';
import { LedgerChip } from '@views/gostop/ui/LedgerChip';

interface GoLineProps {
  goCount: number;
}

export function GoLine({ goCount }: GoLineProps) {
  const bonus = goBonusOf(goCount);
  const hasTimes = bonus.times > 1;

  return (
    <LedgerChip>
      <span className="font-semibold text-text-secondary">{`${goCount}${GOSTOP_COPY.goUnit}`}</span>
      <span className="font-black text-text-primary">{`${RESULT_COPY.plus}${bonus.add}${GOSTOP_COPY.points}`}</span>
      {hasTimes && <b className="font-black text-text-primary">{`${RESULT_COPY.times}${bonus.times}`}</b>}
    </LedgerChip>
  );
}
