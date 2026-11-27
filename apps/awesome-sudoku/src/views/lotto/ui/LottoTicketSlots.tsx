import { LOTTO_COPY } from '@views/lotto/config/copy';
import { ticketSlotsOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoBall } from '@views/lotto/ui/LottoBall';

export function LottoTicketSlots() {
  const { ticket } = useLottoContext();
  return (
    <ol
      aria-label={LOTTO_COPY.ticketTitle}
      className="flex items-center justify-between gap-1.5 sm:justify-start sm:gap-2.5"
    >
      {ticketSlotsOf(ticket).map((number, index) => (
        <li key={number ?? `empty-${index}`} className="flex">
          {number === null ? (
            <span className="size-9 rounded-full border-2 border-dashed border-border-medium sm:size-11">
              <span className="sr-only">{LOTTO_COPY.emptySlot}</span>
            </span>
          ) : (
            <LottoBall number={number} />
          )}
        </li>
      ))}
    </ol>
  );
}
