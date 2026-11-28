import { cn } from '@shared/lib/cn';
import { CAPTURED_PILE_HEIGHT } from '@views/gostop/config/table';
import type { CardKind, Side } from '@views/gostop/model/types/gostop';
import { CapturedCard } from '@views/gostop/ui/CapturedCard';
import { CapturedPileHead } from '@views/gostop/ui/CapturedPileHead';

interface CapturedPileProps {
  side: Side;
  kind: CardKind;
  ids: readonly number[];
  points: number;
}

export function CapturedPile({ side, kind, ids, points }: CapturedPileProps) {
  return (
    <li className="min-w-0">
      <CapturedPileHead kind={kind} ids={ids} points={points} />
      <ul className={cn('mt-0.5 flex', CAPTURED_PILE_HEIGHT[side])}>
        {ids.map((id) => (
          <CapturedCard key={id} id={id} side={side} />
        ))}
      </ul>
    </li>
  );
}
