import type { RandomInt } from '@shared/lib/random';
import { LOTTO_MAX_NUMBER, LOTTO_PICK_COUNT } from '@views/lotto/config/lotto';
import { sortAscending } from '@views/lotto/lib/draw';

export const isTicketFull = (ticket: readonly number[]): boolean => ticket.length >= LOTTO_PICK_COUNT;

export function toggleTicketNumber(ticket: readonly number[], number: number): readonly number[] {
  if (ticket.includes(number)) return ticket.filter((picked) => picked !== number);
  if (isTicketFull(ticket)) return ticket;
  return sortAscending([...ticket, number]);
}

export function fillTicket(ticket: readonly number[], randomInt: RandomInt): readonly number[] {
  const filled = new Set(ticket);
  while (filled.size < LOTTO_PICK_COUNT) filled.add(randomInt(LOTTO_MAX_NUMBER) + 1);
  return sortAscending([...filled]);
}
