import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { SuccessIcon } from '@shared/ui/SuccessIcon';
import { GOMOKU_COPY, OUTCOME_TITLE } from '@views/gomoku/config/copy';
import { OUTCOME } from '@views/gomoku/config/game';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function ResultSheet() {
  const { outcome, reset } = useGomokuContext();
  const { isOpen, dismiss } = useDismissible(outcome !== OUTCOME.PLAYING);

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={OUTCOME_TITLE[outcome]}>
      {outcome === OUTCOME.WON && <SuccessIcon />}
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-12 w-full rounded-xl bg-linear-to-b from-gradient-from to-gradient-to text-base font-semibold text-white shadow-lg shadow-gradient-from/30 transition-all duration-200 ease-out hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {GOMOKU_COPY.playAgain}
      </button>
    </BottomSheet>
  );
}
