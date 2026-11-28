import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { DecidePayout } from '@views/gostop/ui/DecidePayout';
import { DecideStat } from '@views/gostop/ui/DecideStat';

export function DecideSheet() {
  const { isDecideOpen, closeDecide, scores, goCount, preview, go, stop } = useGostopContext();
  const nextGo = goCount[SIDE.ME] + 1;

  return (
    <BottomSheet isOpen={isDecideOpen} onClose={closeDecide} title={GOSTOP_COPY.decideTitle}>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <DecideStat label={GOSTOP_COPY.decideNow}>
          {scores[SIDE.ME].total}
          {GOSTOP_COPY.points}
        </DecideStat>
        <DecideStat label={GOSTOP_COPY.decideStop}>
          {preview.stop[SIDE.ME].points}
          {GOSTOP_COPY.points}
        </DecideStat>
        <DecideStat label={`${nextGo}${GOSTOP_COPY.goUnit} ${GOSTOP_COPY.decideGo}`} isAccent>
          {preview.nextGo.points}
          {GOSTOP_COPY.points}
        </DecideStat>
      </dl>
      <DecidePayout />
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
