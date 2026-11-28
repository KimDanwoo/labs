import { GOSTOP_COPY, MONEY_COPY } from '@views/gostop/config/copy';
import { scoreLines } from '@views/gostop/lib/resultLines';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import { LedgerChip } from '@views/gostop/ui/LedgerChip';

interface ScoreLineChipsProps {
  side: Side;
}

export function ScoreLineChips({ side }: ScoreLineChipsProps) {
  const { scores, captured } = useGostopContext();

  return (
    <ul className="flex flex-wrap items-center justify-end gap-1">
      {scoreLines(scores[side], captured[side]).map((line) => (
        <LedgerChip key={line.key}>
          <span className="font-semibold text-text-secondary">{line.label}</span>
          <span className="font-black text-text-primary">{`${line.points}${GOSTOP_COPY.points}`}</span>
        </LedgerChip>
      ))}
      <li className="pl-0.5 text-[14px] font-black whitespace-nowrap text-text-primary">
        {`${MONEY_COPY.equals} ${scores[side].total}${GOSTOP_COPY.points}`}
      </li>
    </ul>
  );
}
