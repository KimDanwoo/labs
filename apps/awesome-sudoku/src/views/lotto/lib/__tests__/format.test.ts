import { describe, expect, it } from 'vitest';

import { LOTTO_RANKS, TOTAL_COMBINATIONS } from '@views/lotto/config/lotto';
import {
  formatBuyingDuration,
  formatKoreanUnits,
  formatOdds,
  formatPercent,
  formatSignedPercent,
  formatTickets,
  formatWon,
  weeksToBuy,
} from '@views/lotto/lib/format';
import { theoreticalOddsOf } from '@views/lotto/lib/tally';

describe('formatKoreanUnits', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1_000, '1,000'],
    [10_000, '1만'],
    [1_000_000, '100만'],
    [8_145_060, '814만 5,060'],
    [100_000_000, '1억'],
    [123_456_789_000, '1,234억 5,678만 9,000'],
  ])('%d → %s', (value, expected) => {
    expect(formatKoreanUnits(value)).toBe(expected);
  });

  it('음수는 0으로 본다', () => {
    expect(formatKoreanUnits(-5)).toBe('0');
  });
});

describe('formatWon · formatTickets', () => {
  it('숫자로 끝나면 단위를 붙이고, 만·억으로 끝나면 띄어 쓴다', () => {
    expect(formatWon(5_000)).toBe('5,000원');
    expect(formatWon(2_000_000_000)).toBe('20억 원');
    expect(formatWon(55_000_000)).toBe('5,500만 원');
    expect(formatTickets(10_000)).toBe('1만 장');
    expect(formatTickets(8_145_061)).toBe('814만 5,061장');
  });
});

describe('formatOdds', () => {
  it.each([
    [1, '1/8,145,060'],
    [2, '1/1,357,510'],
    [3, '1/35,724'],
    [4, '1/733'],
    [5, '1/45'],
  ] as const)('%d등 이론 확률은 %s', (rank, expected) => {
    expect(formatOdds(theoreticalOddsOf(rank))).toBe(expected);
  });

  it('0이면 줄표를 보인다', () => {
    expect(formatOdds(0)).toBe('—');
  });

  it('모든 등수가 1/n 꼴이다', () => {
    LOTTO_RANKS.forEach((rank) => expect(formatOdds(theoreticalOddsOf(rank))).toMatch(/^1\/[\d,]+$/));
    expect(formatOdds(1 / TOTAL_COMBINATIONS)).toBe('1/8,145,060');
  });
});

describe('formatPercent', () => {
  it('소수 자릿수를 정할 수 있다', () => {
    expect(formatPercent(0.4823)).toBe('48.2%');
    expect(formatPercent(0.5, 0)).toBe('50%');
  });

  it('부호를 붙인다', () => {
    expect(formatSignedPercent(0.25)).toBe('+25.0%');
    expect(formatSignedPercent(-0.517)).toBe('-51.7%');
    expect(formatSignedPercent(0)).toBe('0.0%');
  });
});

describe('formatBuyingDuration', () => {
  it('매주 5장 기준으로 주 수를 올림한다', () => {
    expect(weeksToBuy(5)).toBe(1);
    expect(weeksToBuy(6)).toBe(2);
  });

  it('1년(52주)이 안 되면 주로, 넘으면 년으로 보인다', () => {
    expect(formatBuyingDuration(50)).toBe('10주');
    expect(formatBuyingDuration(260)).toBe('1년');
    expect(formatBuyingDuration(8_145_060)).toBe('31,327년');
  });
});
