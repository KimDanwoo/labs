import { cn } from '@shared/lib/cn';
import { Badge } from '@shared/ui/badge';
import { GOSTOP_COPY, KIND_LABEL } from '@views/gostop/config/copy';
import { kindCount } from '@views/gostop/lib/view';
import type { CardKind } from '@views/gostop/model/types/gostop';
import styles from '@views/gostop/styles/hwatuMotion.module.css';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface CapturedGroupProps {
  kind: CardKind;
  ids: readonly number[];
  points: number;
}

export function CapturedGroup({ kind, ids, points }: CapturedGroupProps) {
  const hasPoints = points > 0;

  return (
    <div className="min-w-0 rounded-xl bg-face px-2 pt-1.5 pb-2">
      <p className="flex h-[18px] items-center gap-1 text-xs">
        <span className="font-semibold text-text-secondary">{KIND_LABEL[kind]}</span>
        <span className="font-bold text-text-primary tabular-nums">{kindCount(kind, ids)}</span>
        {hasPoints && (
          <Badge className="ml-auto h-[18px] px-1.5 text-[11px]">
            {points}
            {GOSTOP_COPY.points}
          </Badge>
        )}
      </p>
      <ul className="mt-1 flex h-[39px] lg:h-12">
        {ids.map((id) => (
          <li
            key={id}
            className={cn('relative min-w-0 shrink grow-0 basis-[26px] last:shrink-0 lg:basis-8', styles.taken)}
          >
            <HwatuCard id={id} className="absolute top-0 left-0 w-[26px] lg:w-8" />
          </li>
        ))}
      </ul>
    </div>
  );
}
