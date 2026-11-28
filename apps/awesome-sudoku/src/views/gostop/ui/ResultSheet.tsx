import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { GOSTOP_COPY, OUTCOME_TITLE } from '@views/gostop/config/copy';
import { PHASE } from '@views/gostop/config/game';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { RecordStats } from '@views/gostop/ui/RecordStats';
import { ResultBanner } from '@views/gostop/ui/ResultBanner';
import { ResultSummary } from '@views/gostop/ui/ResultSummary';

export function ResultSheet() {
  const { phase, result, deal } = useGostopContext();
  const { isOpen, dismiss } = useDismissible(phase === PHASE.OVER);

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={OUTCOME_TITLE[outcomeOf(result)]}>
      <ResultBanner />
      <ResultSummary />
      <div className="mt-4 grid justify-items-center">
        <RecordStats />
      </div>
      <Button size="l" isFull onClick={deal} className="mt-5">
        {GOSTOP_COPY.playAgain}
      </Button>
    </BottomSheet>
  );
}
