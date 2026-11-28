import { GOSTOP_COPY, KIND_LABEL } from '@views/gostop/config/copy';
import { kindCount } from '@views/gostop/lib/view';
import type { CardKind } from '@views/gostop/model/types/gostop';

interface CapturedPileHeadProps {
  kind: CardKind;
  ids: readonly number[];
  points: number;
}

export function CapturedPileHead({ kind, ids, points }: CapturedPileHeadProps) {
  const hasPoints = points > 0;

  return (
    <p className="flex h-4 items-center gap-1 text-[12px] leading-none">
      <span className="font-semibold text-white/60">{KIND_LABEL[kind]}</span>
      <span className="font-bold text-white tabular-nums">{kindCount(kind, ids)}</span>
      {hasPoints && (
        <span className="ml-auto shrink-0 rounded-full bg-lemon px-1.5 text-[12px] leading-4 font-black text-ink tabular-nums">
          {points}
          {GOSTOP_COPY.points}
        </span>
      )}
    </p>
  );
}
