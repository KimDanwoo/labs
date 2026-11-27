import { LuPlus } from 'react-icons/lu';

import { LOTTO_COPY } from '@views/lotto/config/copy';
import { EMPTY_SLOT_CLASS } from '@views/lotto/config/style';
import { ticketSlotsOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoTrayDivider } from '@views/lotto/ui/LottoTrayDivider';
import { LottoTraySlot } from '@views/lotto/ui/LottoTraySlot';

export function LottoTrayTicket() {
  const { ticket } = useLottoContext();

  return (
    <ol aria-label={LOTTO_COPY.ticketLabel} className="flex items-center gap-1.5 sm:gap-2.5">
      {ticketSlotsOf(ticket).map((number, index) => (
        <li key={number ?? `empty-${index}`} className="flex">
          <LottoTraySlot number={number} />
        </li>
      ))}
      <LottoTrayDivider />
      <li aria-hidden="true" className="flex">
        <span className={EMPTY_SLOT_CLASS}>
          <LuPlus className="size-3.5 opacity-60" />
        </span>
      </li>
    </ol>
  );
}
