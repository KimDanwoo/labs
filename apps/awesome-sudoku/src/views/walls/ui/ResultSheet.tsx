import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
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
      <p className="mt-4 text-center text-3xl font-bold text-text-primary font-tabular">
        {scores[SIDE.ME]} : {scores[SIDE.COMPUTER]}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-12 w-full rounded-xl bg-primary text-base font-semibold text-on-primary transition-all duration-200 ease-out hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {WALLS_COPY.playAgain}
      </button>
    </BottomSheet>
  );
}
