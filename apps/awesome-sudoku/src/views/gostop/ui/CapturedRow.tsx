import { CAPTURE_KINDS } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { capturedByKind, kindPoints } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import { CapturedPile } from '@views/gostop/ui/CapturedPile';

interface CapturedRowProps {
  side: Side;
}

export function CapturedRow({ side }: CapturedRowProps) {
  const { captured, scores } = useGostopContext();
  const groups = capturedByKind(captured[side]);
  const label = side === SIDE.ME ? GOSTOP_COPY.capturedLabel : GOSTOP_COPY.rivalCapturedLabel;

  return (
    <ul aria-label={label} className="grid grid-cols-[1fr_1fr_1fr_1.5fr] gap-1.5 lg:gap-2">
      {CAPTURE_KINDS.map((kind) => (
        <CapturedPile key={kind} side={side} kind={kind} ids={groups[kind]} points={kindPoints(kind, scores[side])} />
      ))}
    </ul>
  );
}
