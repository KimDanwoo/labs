import { StatusPill } from '@shared/ui/status-pill';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoProgressBar } from '@views/lotto/ui/LottoProgressBar';
import { LottoStatusText } from '@views/lotto/ui/LottoStatusText';
import { LottoStopButton } from '@views/lotto/ui/LottoStopButton';

export function LottoStatus() {
  const { singleDraw, isSimulating } = useLottoContext();

  return (
    <>
      <StatusPill.Root role="status" aria-live="polite" className="relative overflow-hidden">
        <LottoStatusText key={singleDraw?.round ?? 0} />
        {isSimulating && <LottoProgressBar />}
      </StatusPill.Root>
      {isSimulating && <LottoStopButton />}
    </>
  );
}
