import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { TILE_CLASS } from '@views/lotto/config/style';
import { formatBuyingDuration, formatTickets } from '@views/lotto/lib/format';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoJackpotNote() {
  const { simulation } = useLottoContext();
  const isJackpot = simulation.request?.mode === 'jackpot';
  const tickets = simulation.result?.tally.tickets ?? 0;

  if (!isJackpot) return null;

  return (
    <p className={cn('px-4 py-3 text-sm leading-relaxed text-text-primary break-keep', TILE_CLASS)}>
      {LOTTO_COPY.jackpotDuration(formatTickets(tickets), formatBuyingDuration(tickets))}
    </p>
  );
}
