import { Button } from '@shared/ui/button';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { ResultBanner } from '@views/gostop/ui/ResultBanner';
import { ResultLedger } from '@views/gostop/ui/ResultLedger';
import { ResultRecordLine } from '@views/gostop/ui/ResultRecordLine';
import { ResultRival } from '@views/gostop/ui/ResultRival';

export function ResultSheetBody() {
  const { deal } = useGostopContext();

  return (
    <>
      <ResultBanner />
      <ResultRival />
      <ResultLedger />
      <ResultRecordLine />
      <Button size="l" isFull onClick={deal} className="mt-3">
        {GOSTOP_COPY.playAgain}
      </Button>
    </>
  );
}
