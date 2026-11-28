import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { goPreview } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { DecideStat } from '@views/gostop/ui/DecideStat';

export function DecideSheet() {
  const { isDeciding, scores, goCount, go, stop } = useGostopContext();
  const { isOpen, dismiss } = useDismissible(isDeciding);
  const total = scores[SIDE.ME].total;
  const nextGo = goCount[SIDE.ME] + 1;
  const preview = goPreview(total, goCount[SIDE.ME]);

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={GOSTOP_COPY.decideTitle}>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <DecideStat label={GOSTOP_COPY.decideNow}>
          {total}
          {GOSTOP_COPY.points}
        </DecideStat>
        <DecideStat label={GOSTOP_COPY.decideStop}>
          {preview.stop}
          {GOSTOP_COPY.points}
        </DecideStat>
        <DecideStat label={`${nextGo}${GOSTOP_COPY.goUnit} ${GOSTOP_COPY.decideGo}`} isAccent>
          {preview.go}
          {GOSTOP_COPY.points}
        </DecideStat>
      </dl>
      <p className="mt-3 text-center text-[13px] text-text-tertiary break-keep">{GOSTOP_COPY.decideNote}</p>
      <div className="mt-5 grid grid-cols-[1fr_1.6fr] gap-2">
        <Button variant="weak" size="xl" onClick={stop}>
          {GOSTOP_COPY.stop}
        </Button>
        <Button size="xl" onClick={go}>
          {GOSTOP_COPY.go}
        </Button>
      </div>
    </BottomSheet>
  );
}
