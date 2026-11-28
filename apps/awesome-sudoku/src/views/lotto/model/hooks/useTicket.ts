'use client';

import { useState } from 'react';

import type { RandomInt } from '@shared/lib/random';
import { fillTicket, isTicketFull, toggleTicketNumber } from '@views/lotto/lib/ticket';

export function useTicket(randomInt: RandomInt) {
  const [ticket, setTicket] = useState<readonly number[]>([]);

  return {
    ticket,
    isTicketComplete: isTicketFull(ticket),
    toggleNumber: (number: number) => setTicket((current) => toggleTicketNumber(current, number)),
    autoFill: () => setTicket((current) => fillTicket(current, randomInt)),
    clearTicket: () => setTicket([]),
  };
}
