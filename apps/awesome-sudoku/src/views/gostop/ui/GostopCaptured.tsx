import { CAPTURE_KINDS } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { capturedByKind, kindPoints } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CapturedGroup } from '@views/gostop/ui/CapturedGroup';

export function GostopCaptured() {
  const { captured, scores } = useGostopContext();
  const groups = capturedByKind(captured[SIDE.ME]);

  return (
    <section aria-label={GOSTOP_COPY.capturedLabel} className="grid grid-cols-[1fr_1fr_1fr_1.45fr] gap-1.5 lg:gap-2">
      {CAPTURE_KINDS.map((kind) => (
        <CapturedGroup key={kind} kind={kind} ids={groups[kind]} points={kindPoints(kind, scores[SIDE.ME])} />
      ))}
    </section>
  );
}
