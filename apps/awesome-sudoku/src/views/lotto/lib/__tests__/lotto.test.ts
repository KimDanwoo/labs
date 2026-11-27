import { describe, expect, it } from 'vitest';

import {
  LOTTO_MAX_NUMBER,
  LOTTO_RANKS,
  RANK_WINNING_COMBINATIONS,
  TOTAL_COMBINATIONS,
  type LottoRank,
} from '@views/lotto/config/lotto';
import { createNumberPool, drawNumbers } from '@views/lotto/lib/draw';
import { createCryptoRandom, type RandomInt } from '@views/lotto/lib/random';
import { createTicketFlags, gradeMatches, rankOf } from '@views/lotto/lib/rank';
import { runTicketChunk, simulateInChunks } from '@views/lotto/lib/simulate';
import { createEmptyTally, returnRateOf, spentOf, wonOf } from '@views/lotto/lib/tally';
import { fillTicket, toggleTicketNumber } from '@views/lotto/lib/ticket';

const UINT32_RANGE = 2 ** 32;
const WINNING_DRAW = { numbers: [1, 2, 3, 4, 5, 6], bonus: 7 };

const createSeededRandom = (seed: number): RandomInt => {
  let state = seed;
  return (bound) => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return Math.floor((((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE) * bound);
  };
};

const alwaysFirst: RandomInt = () => 0;

const countRanksOverAllTickets = (): Record<LottoRank, number> => {
  const counts: Record<LottoRank, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const flags = createTicketFlags(WINNING_DRAW.numbers);
  const isBonus = (number: number): boolean => number === WINNING_DRAW.bonus;
  const visit = (start: number, picked: number, matches: number, hasBonus: boolean): void => {
    if (picked === 6) {
      const rank = gradeMatches(matches, hasBonus);
      if (rank !== null) counts[rank] += 1;
      return;
    }
    for (let number = start; number <= LOTTO_MAX_NUMBER; number += 1) {
      visit(number + 1, picked + 1, matches + (flags[number] ?? 0), hasBonus || isBonus(number));
    }
  };
  visit(1, 0, 0, false);
  return counts;
};

describe('로또 등수 판정', () => {
  it('일치 개수와 보너스로 등수를 매긴다', () => {
    expect(rankOf([1, 2, 3, 4, 5, 6], WINNING_DRAW)).toBe(1);
    expect(rankOf([1, 2, 3, 4, 5, 7], WINNING_DRAW)).toBe(2);
    expect(rankOf([1, 2, 3, 4, 5, 45], WINNING_DRAW)).toBe(3);
    expect(rankOf([1, 2, 3, 4, 7, 45], WINNING_DRAW)).toBe(4);
    expect(rankOf([1, 2, 3, 7, 44, 45], WINNING_DRAW)).toBe(5);
    expect(rankOf([1, 2, 7, 43, 44, 45], WINNING_DRAW)).toBeNull();
  });

  it('모든 조합을 세면 등수별 당첨 조합 수가 이론값과 같다', () => {
    const counts = countRanksOverAllTickets();
    expect(counts).toEqual(RANK_WINNING_COMBINATIONS);
    expect(TOTAL_COMBINATIONS).toBe(8_145_060);
  });
});

describe('로또 추첨', () => {
  it('1~45에서 겹치지 않는 6개를 오름차순으로, 보너스는 그 밖에서 뽑는다', () => {
    const randomInt = createSeededRandom(7);
    for (let round = 0; round < 1_000; round += 1) {
      const { numbers, bonus } = drawNumbers(randomInt);
      expect(new Set([...numbers, bonus]).size).toBe(7);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      expect(Math.min(...numbers, bonus)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...numbers, bonus)).toBeLessThanOrEqual(LOTTO_MAX_NUMBER);
    }
  });

  it('암호 난수는 0부터 bound-1까지 모든 값을 낸다', () => {
    const randomInt = createCryptoRandom();
    const seen = new Set(Array.from({ length: 20_000 }, () => randomInt(LOTTO_MAX_NUMBER)));
    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: LOTTO_MAX_NUMBER }, (_, index) => index));
  });
});

describe('번호 고르기', () => {
  it('번호를 넣고 빼며 6개가 차면 더 넣지 않는다', () => {
    expect(toggleTicketNumber([10, 3], 7)).toEqual([3, 7, 10]);
    expect(toggleTicketNumber([3, 7, 10], 7)).toEqual([3, 10]);
    expect(toggleTicketNumber([1, 2, 3, 4, 5, 6], 9)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('자동은 고른 번호를 두고 남은 칸만 채운다', () => {
    const filled = fillTicket([5, 40], createSeededRandom(3));
    expect(filled).toHaveLength(6);
    expect(new Set(filled).size).toBe(6);
    expect(filled).toEqual(expect.arrayContaining([5, 40]));
  });
});

describe('몰아 사기', () => {
  const winningTicketInput = (size: number, shouldStopOnJackpot: boolean) => ({
    flags: createTicketFlags([1, 2, 3, 4, 5, 6]),
    pool: createNumberPool(),
    size,
    shouldStopOnJackpot,
  });

  it('1등 모드는 1등이 나오면 바로 멈춘다', () => {
    expect(runTicketChunk(winningTicketInput(10, true), alwaysFirst).tickets).toBe(1);
    expect(runTicketChunk(winningTicketInput(10, false), alwaysFirst).counts[1]).toBe(10);
  });

  it('정해진 장수를 묶음으로 나눠 진행 상황을 알린다', () => {
    const progress = [
      ...simulateInChunks({ mode: 'bulk', ticket: [1, 2, 3, 4, 5, 6], count: 450_000 }, createSeededRandom(11)),
    ].map(({ tally }) => tally.tickets);
    expect(progress).toEqual([200_000, 400_000, 450_000]);
  });

  it('100만 장을 사면 4·5등 비율이 이론 확률 근처다', () => {
    const results = [
      ...simulateInChunks({ mode: 'bulk', ticket: [3, 11, 19, 27, 35, 43], count: 1_000_000 }, createSeededRandom(5)),
    ];
    const { tally } = results.at(-1) ?? { tally: createEmptyTally() };
    expect(tally.counts[5] / tally.tickets).toBeCloseTo(182_780 / TOTAL_COMBINATIONS, 3);
    expect(tally.counts[4] / tally.tickets).toBeCloseTo(11_115 / TOTAL_COMBINATIONS, 3);
  });
});

describe('손익 계산', () => {
  it('쓴 돈, 받은 돈, 수익률을 계산한다', () => {
    const tally = { tickets: 100, counts: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 } };
    expect(spentOf(tally)).toBe(100_000);
    expect(wonOf(tally)).toBe(60_000);
    expect(returnRateOf(tally)).toBeCloseTo(0.6);
    expect(returnRateOf(createEmptyTally())).toBe(0);
    expect(LOTTO_RANKS).toHaveLength(5);
  });
});
