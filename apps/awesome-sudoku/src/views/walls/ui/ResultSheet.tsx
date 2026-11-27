import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { SuccessIcon } from '@shared/ui/SuccessIcon';
import { SIDE } from '@views/walls/config/board';
import { OUTCOME_TITLE, WALLS_COPY } from '@views/walls/config/copy';
import { OUTCOME } from '@views/walls/config/game';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function ResultSheet() {
  const { outcome, scores, reset } = useWallsContext();
  const { isOpen, dismiss } = useDismissible(outcome !== OUTCOME.PLAYING);

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={OUTCOME_TITLE[outcome]}>
      {outcome === OUTCOME.WON && <SuccessIcon />}
      <p className="mt-4 rounded-2xl bg-weak py-4 text-center text-3xl font-bold text-text-primary tabular-nums">
        {scores[SIDE.ME]} : {scores[SIDE.COMPUTER]}
      </p>
      <Button size="l" isFull onClick={reset} className="mt-6">
        {WALLS_COPY.playAgain}
      </Button>
    </BottomSheet>
  );
}
