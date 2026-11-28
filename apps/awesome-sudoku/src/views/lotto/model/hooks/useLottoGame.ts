'use client';

import { useState } from 'react';

import { createCryptoRandom } from '@shared/lib/random';
import { JACKPOT_TICKET_LIMIT } from '@views/lotto/config/lotto';
import { useSimulation } from '@views/lotto/model/hooks/useSimulation';
import { useSingleDraw } from '@views/lotto/model/hooks/useSingleDraw';
import { useTicket } from '@views/lotto/model/hooks/useTicket';

export function useLottoGame() {
  const [randomInt] = useState(createCryptoRandom);
  const ticketModel = useTicket(randomInt);
  const { singleDraw, drawOnce } = useSingleDraw(randomInt);
  const simulation = useSimulation();
  const { ticket } = ticketModel;

  return {
    ...ticketModel,
    singleDraw,
    drawOnce: () => drawOnce(ticket),
    simulation: simulation.run,
    isSimulating: simulation.isRunning,
    runBulk: (count: number) => simulation.start({ mode: 'bulk', ticket, count }),
    runUntilJackpot: () => simulation.start({ mode: 'jackpot', ticket, limit: JACKPOT_TICKET_LIMIT }),
    cancelSimulation: simulation.cancel,
  };
}

export type LottoGame = ReturnType<typeof useLottoGame>;
