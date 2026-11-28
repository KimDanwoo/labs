import { Badge } from '@shared/ui/badge';
import { CAPTURE_KINDS } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY, KIND_SHORT } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { capturedByKind, kindCount } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { RivalBacks } from '@views/gostop/ui/RivalBacks';

export function GostopRival() {
  const { rivalHandCount, captured, scores } = useGostopContext();
  const groups = capturedByKind(captured[SIDE.COMPUTER]);

  return (
    <section
      aria-label={GOSTOP_COPY.rivalLabel}
      className="flex h-12 items-center gap-2 rounded-2xl bg-face px-3 lg:h-14 lg:px-4"
    >
      <RivalBacks count={rivalHandCount} />
      <p className="text-[13px] font-semibold text-text-secondary tabular-nums">
        <span className="sr-only">{GOSTOP_COPY.rivalLabel} </span>
        {rivalHandCount}
        {GOSTOP_COPY.rivalHand}
      </p>
      <dl
        aria-label={GOSTOP_COPY.rivalCapturedLabel}
        className="ml-auto flex items-center gap-2 text-[13px] tabular-nums lg:gap-3 lg:text-sm"
      >
        {CAPTURE_KINDS.map((kind) => (
          <div key={kind} className="flex gap-0.5">
            <dt className="text-text-tertiary">{KIND_SHORT[kind]}</dt>
            <dd className="font-bold text-text-primary">{kindCount(kind, groups[kind])}</dd>
          </div>
        ))}
      </dl>
      <Badge tone="ink">
        {scores[SIDE.COMPUTER].total}
        {GOSTOP_COPY.points}
      </Badge>
    </section>
  );
}
