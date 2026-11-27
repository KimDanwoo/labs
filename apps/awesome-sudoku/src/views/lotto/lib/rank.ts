import { LOTTO_MAX_NUMBER, type LottoRank } from '@views/lotto/config/lotto';
import type { LottoDraw } from '@views/lotto/model/types/lotto';

const SECOND_CHANCE_MATCHES = 5;
const RANK_BY_MATCHES: readonly (LottoRank | null)[] = [null, null, null, 5, 4, 3, 1];

export function gradeMatches(matches: number, hasBonus: boolean): LottoRank | null {
  const isSecondPlace = matches === SECOND_CHANCE_MATCHES && hasBonus;
  if (isSecondPlace) return 2;
  return RANK_BY_MATCHES[matches] ?? null;
}

export function createTicketFlags(ticket: readonly number[]): Uint8Array {
  const flags = new Uint8Array(LOTTO_MAX_NUMBER + 1);
  ticket.forEach((number) => {
    flags[number] = 1;
  });
  return flags;
}

export const countMatches = (ticket: readonly number[], numbers: readonly number[]): number =>
  numbers.filter((number) => ticket.includes(number)).length;

export const rankOf = (ticket: readonly number[], draw: LottoDraw): LottoRank | null =>
  gradeMatches(countMatches(ticket, draw.numbers), ticket.includes(draw.bonus));
