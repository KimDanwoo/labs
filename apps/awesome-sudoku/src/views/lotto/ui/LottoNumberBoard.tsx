import { LOTTO_COPY } from '@views/lotto/config/copy';
import { LOTTO_NUMBERS } from '@views/lotto/config/display';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoNumberToggle } from '@views/lotto/ui/LottoNumberToggle';
import { LottoSection } from '@views/lotto/ui/LottoSection';

export function LottoNumberBoard() {
  const { ticket, isTicketComplete, isSimulating, toggleNumber } = useLottoContext();
  return (
    <LottoSection title={LOTTO_COPY.boardTitle} description={LOTTO_COPY.boardDescription}>
      <div role="group" aria-label={LOTTO_COPY.boardTitle} className="grid grid-cols-7 gap-1.5 sm:grid-cols-9 sm:gap-2">
        {LOTTO_NUMBERS.map((number) => (
          <LottoNumberToggle
            key={number}
            number={number}
            isPicked={ticket.includes(number)}
            isLocked={isTicketComplete}
            isFrozen={isSimulating}
            onToggle={toggleNumber}
          />
        ))}
      </div>
    </LottoSection>
  );
}
