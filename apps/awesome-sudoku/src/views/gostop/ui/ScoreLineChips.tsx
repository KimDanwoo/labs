import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { scoreLines } from '@views/gostop/lib/resultLines';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';

interface ScoreLineChipsProps {
  side: Side;
}

export function ScoreLineChips({ side }: ScoreLineChipsProps) {
  const { scores, captured } = useGostopContext();

  return (
    <ul className="flex flex-wrap justify-end gap-1.5">
      {scoreLines(scores[side], captured[side]).map((line) => (
        <li
          key={line.key}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-surface-elevated px-2.5 text-[14px] ring-1 ring-border-light"
        >
          <span className="font-semibold text-text-secondary">{line.label}</span>
          <span className="font-black text-text-primary">{`${line.points}${GOSTOP_COPY.points}`}</span>
        </li>
      ))}
    </ul>
  );
}
