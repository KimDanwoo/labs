import { LOTTO_COPY } from '@views/lotto/config/copy';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoButton } from '@views/lotto/ui/LottoButton';
import { LottoJackpotLive } from '@views/lotto/ui/LottoJackpotLive';
import { LottoJackpotOutcome } from '@views/lotto/ui/LottoJackpotOutcome';
import { LottoSection } from '@views/lotto/ui/LottoSection';

export function LottoJackpotRun() {
  const { isTicketComplete, isSimulating, runUntilJackpot } = useLottoContext();
  const canRun = isTicketComplete && !isSimulating;
  const handleRun = () => runUntilJackpot();
  return (
    <LottoSection
      title={LOTTO_COPY.jackpotTitle}
      description={isTicketComplete ? LOTTO_COPY.jackpotDescription : LOTTO_COPY.lockedHint}
    >
      <LottoButton disabled={!canRun} onClick={handleRun} className="w-full">
        {LOTTO_COPY.jackpotButton}
      </LottoButton>
      <LottoJackpotLive />
      <LottoJackpotOutcome />
    </LottoSection>
  );
}
