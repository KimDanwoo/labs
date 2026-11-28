import { Button } from '@shared/ui/button';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { RecordStats } from '@views/gostop/ui/RecordStats';
import { ResultBanner } from '@views/gostop/ui/ResultBanner';
import { ResultSummary } from '@views/gostop/ui/ResultSummary';

export function ResultSheetBody() {
  const { deal } = useGostopContext();

  return (
    <>
      <ResultBanner />
      <ResultSummary />
      <div className="mt-4 grid justify-items-center">
        <RecordStats />
      </div>
      <Button size="l" isFull onClick={deal} className="mt-5">
        {GOSTOP_COPY.playAgain}
      </Button>
    </>
  );
}
