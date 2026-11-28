import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { SuccessIcon } from '@shared/ui/SuccessIcon';
import { GOSTOP_COPY, OUTCOME_TITLE } from '@views/gostop/config/copy';
import { PHASE } from '@views/gostop/config/game';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useNewGame } from '@views/gostop/model/hooks/useNewGame';
import { ResultSummary } from '@views/gostop/ui/ResultSummary';

export function ResultSheet() {
  const { phase, result } = useGostopContext();
  const { isOpen, dismiss } = useDismissible(phase === PHASE.OVER);
  const handleNewGame = useNewGame();
  const outcome = outcomeOf(result);

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={OUTCOME_TITLE[outcome]}>
      {outcome === 'win' && <SuccessIcon />}
      <ResultSummary />
      <Button size="l" isFull onClick={handleNewGame} className="mt-6">
        {GOSTOP_COPY.playAgain}
      </Button>
    </BottomSheet>
  );
}
