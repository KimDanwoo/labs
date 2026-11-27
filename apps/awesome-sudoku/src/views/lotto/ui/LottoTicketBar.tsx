import { LOTTO_COPY } from '@views/lotto/config/copy';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoButton } from '@views/lotto/ui/LottoButton';
import { LottoSection } from '@views/lotto/ui/LottoSection';
import { LottoTicketSlots } from '@views/lotto/ui/LottoTicketSlots';

export function LottoTicketBar() {
  const { ticket, isTicketComplete, isSimulating, autoFill, clearTicket } = useLottoContext();
  const hasNumbers = ticket.length > 0;
  const isAutoFillDisabled = isTicketComplete || isSimulating;
  const isClearDisabled = !hasNumbers || isSimulating;
  const handleAutoFill = () => autoFill();
  const handleClear = () => clearTicket();
  return (
    <LottoSection title={LOTTO_COPY.ticketTitle} description={LOTTO_COPY.ticketCount(ticket.length)}>
      <LottoTicketSlots />
      <div className="grid grid-cols-2 gap-2">
        <LottoButton variant="secondary" size="sm" disabled={isAutoFillDisabled} onClick={handleAutoFill}>
          {LOTTO_COPY.autoFill}
        </LottoButton>
        <LottoButton variant="secondary" size="sm" disabled={isClearDisabled} onClick={handleClear}>
          {LOTTO_COPY.clear}
        </LottoButton>
      </div>
    </LottoSection>
  );
}
