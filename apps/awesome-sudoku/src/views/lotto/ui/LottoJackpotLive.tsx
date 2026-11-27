import { LOTTO_COPY } from '@views/lotto/config/copy';
import { TICKET_PRICE } from '@views/lotto/config/lotto';
import { formatTickets, formatWon } from '@views/lotto/lib/format';
import { phaseOfMode } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoStatTile } from '@views/lotto/ui/LottoStatTile';
import { LottoStopButton } from '@views/lotto/ui/LottoStopButton';

export function LottoJackpotLive() {
  const { simulation } = useLottoContext();
  if (phaseOfMode(simulation, 'jackpot') !== 'running') return null;
  const tickets = simulation.result?.tally.tickets ?? 0;
  return (
    <div className="space-y-2.5">
      <dl className="grid grid-cols-2 gap-2">
        <LottoStatTile label={LOTTO_COPY.liveTickets} value={formatTickets(tickets)} />
        <LottoStatTile label={LOTTO_COPY.liveSpent} value={formatWon(tickets * TICKET_PRICE)} />
      </dl>
      <LottoStopButton />
    </div>
  );
}
