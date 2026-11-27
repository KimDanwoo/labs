import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { GLASS_LENS_CLASS } from '@views/lotto/config/style';
import { formatBuyingDuration, formatTickets } from '@views/lotto/lib/format';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoJackpotNote() {
  const { simulation } = useLottoContext();
  const isJackpot = simulation.request?.mode === 'jackpot';
  const tickets = simulation.result?.tally.tickets ?? 0;

  if (!isJackpot) return null;

  return (
    <p className={cn('rounded-2xl px-4 py-3 text-sm leading-relaxed text-text-primary break-keep', GLASS_LENS_CLASS)}>
      {LOTTO_COPY.jackpotDuration(formatTickets(tickets), formatBuyingDuration(tickets))}
    </p>
  );
}
