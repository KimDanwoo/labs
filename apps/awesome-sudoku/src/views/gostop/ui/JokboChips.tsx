import { cn } from '@shared/lib/cn';
import { JOKBO_LABEL, SHEET_COPY } from '@views/gostop/config/copy';
import { JOKBO_CHIP } from '@views/gostop/config/table';
import { jokboProgress } from '@views/gostop/lib/jokbo';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';

interface JokboChipsProps {
  side: Side;
}

export function JokboChips({ side }: JokboChipsProps) {
  const { captured } = useGostopContext();

  return (
    <ul aria-label={SHEET_COPY.jokbo} className="flex flex-wrap gap-1.5">
      {jokboProgress(captured[side]).map((step) => (
        <li key={step.key} className={cn(JOKBO_CHIP.base, step.isDone ? JOKBO_CHIP.done : JOKBO_CHIP.open)}>
          {JOKBO_LABEL[step.key]}
          <span className="tabular-nums">{`${step.have}/${step.need}`}</span>
        </li>
      ))}
    </ul>
  );
}
