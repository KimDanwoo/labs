import { LOTTO_COPY } from '@views/lotto/config/copy';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoButton } from '@views/lotto/ui/LottoButton';
import { LottoDrawBalls } from '@views/lotto/ui/LottoDrawBalls';
import { LottoDrawVerdict } from '@views/lotto/ui/LottoDrawVerdict';
import { LottoSection } from '@views/lotto/ui/LottoSection';

export function LottoSingleDraw() {
  const { isTicketComplete, drawOnce } = useLottoContext();
  const handleDraw = () => drawOnce();
  return (
    <LottoSection
      title={LOTTO_COPY.drawTitle}
      description={isTicketComplete ? LOTTO_COPY.drawDescription : LOTTO_COPY.lockedHint}
    >
      <LottoButton disabled={!isTicketComplete} onClick={handleDraw} className="w-full">
        {LOTTO_COPY.drawButton}
      </LottoButton>
      <LottoDrawBalls />
      <LottoDrawVerdict />
    </LottoSection>
  );
}
