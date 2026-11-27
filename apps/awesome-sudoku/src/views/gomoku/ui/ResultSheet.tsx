import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
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
      <Button size="l" isFull onClick={reset} className="mt-6">
        {GOMOKU_COPY.playAgain}
      </Button>
    </BottomSheet>
  );
}
