import { PHASE, SIDE } from '@views/gostop/config/game';
import { DAILY_BONUS, MONEY_LIMIT, RIVAL_MONEY, STAKE } from '@views/gostop/config/money';
import { RIVAL_NAME } from '@views/gostop/config/rival';
import { INITIAL_WALLET, settleGame } from '@views/gostop/lib/money';
import {
  allInMoodOf,
  bonusAnnouncement,
  bonusShownAmount,
  cappedNote,
  claimToday,
  finishedGameOf,
  formatMoney,
  moneyAnnouncement,
  settlementLine,
  settlementOfView,
  sideDelta,
  signedMoney,
  stopPayout,
  walletView,
  withMoneyLine,
} from '@views/gostop/lib/moneyView';
import type { GameResult } from '@views/gostop/model/types/gostop';
import type { Settlement, Wallet } from '@views/gostop/model/types/money';
import { describe, expect, it } from 'vitest';

const resultOf = (winner: GameResult['winner'], points: number): GameResult => ({
  winner,
  base: points,
  goCount: 0,
  baks: [],
  points,
});

const walletOf = (me: number, computer: number): Wallet => ({
  ...INITIAL_WALLET,
  money: { [SIDE.ME]: me, [SIDE.COMPUTER]: computer },
});

const settlementOf = (overrides: Partial<Settlement>): Settlement => ({
  winner: SIDE.ME,
  points: 32,
  stake: STAKE,
  amount: 3_200,
  isAllIn: false,
  ...overrides,
});

const at = (iso: string) => () => new Date(iso);

describe('머니 표기', () => {
  it('천 단위 쉼표와 원을 붙인다', () => {
    expect(formatMoney(1_000_000)).toBe('1,000,000원');
    expect(formatMoney(0)).toBe('0원');
  });

  it('받으면 +, 잃으면 − 부호를 붙인다', () => {
    expect(signedMoney(3_200, 'gain')).toBe('+3,200원');
    expect(signedMoney(3_200, 'loss')).toBe('−3,200원');
    expect(signedMoney(0, 'even')).toBe('0원');
  });
});

describe('양쪽 머니 변동', () => {
  it('이긴 쪽은 +, 진 쪽은 −, 나가리는 빈칸이다', () => {
    expect(sideDelta(settlementOf({}), SIDE.ME)).toBe('+3,200원');
    expect(sideDelta(settlementOf({}), SIDE.COMPUTER)).toBe('−3,200원');
    expect(sideDelta(settlementOf({ winner: null, points: 0, amount: 0 }), SIDE.ME)).toBe('');
    expect(sideDelta(null, SIDE.ME)).toBe('');
  });
});

describe('정산 한 줄', () => {
  it('점수 × 점당 100원 식을 정확한 숫자로 만든다', () => {
    expect(settlementLine(settlementOf({}))).toEqual({
      flow: 'gain',
      formula: '32점 × 100원 = 3,200원',
      isCapped: false,
    });
    expect(settlementLine(settlementOf({ winner: SIDE.COMPUTER }))).toMatchObject({ flow: 'loss' });
  });

  it('나가리는 변동 없음이다', () => {
    const line = settlementLine(settlementOf({ winner: null, points: 0, amount: 0 }));
    expect(line.flow).toBe('even');
    expect(cappedNote(line, 0)).toBe('');
  });

  it('가진 만큼만 오가면 실제로 오간 금액과 함께 알린다', () => {
    const gain = settlementLine(settlementOf({ amount: 3_000, isAllIn: true }));
    const loss = settlementLine(settlementOf({ winner: SIDE.COMPUTER, amount: 2_000, isAllIn: true }));
    expect(gain.isCapped).toBe(true);
    expect(cappedNote(gain, 3_000)).toBe(`${RIVAL_NAME}이 가진 만큼만 받았어요 (3,000원)`);
    expect(cappedNote(loss, 2_000)).toBe('내가 가진 만큼만 냈어요 (2,000원)');
  });
});

describe('스톱하면 받는 머니', () => {
  it('박까지 반영된 점수 × 100원을 보여 준다', () => {
    const result = { ...resultOf(SIDE.ME, 18), base: 9, baks: ['piBak' as const] };
    expect(stopPayout(walletOf(RIVAL_MONEY, RIVAL_MONEY), result)).toEqual({
      points: 18,
      amount: 1_800,
      isCapped: false,
      baks: ['piBak'],
    });
  });

  it('상대 머니가 모자라면 받을 수 있는 만큼만 보여 준다', () => {
    expect(stopPayout(walletOf(RIVAL_MONEY, 500), resultOf(SIDE.ME, 9))).toMatchObject({
      amount: 500,
      isCapped: true,
    });
  });
});

describe('올인 분위기', () => {
  it('상대가 0이 되면 올인 승, 내가 0이 되면 빈털터리다', () => {
    expect(allInMoodOf(settlementOf({ isAllIn: true }))).toBe('jackpot');
    expect(allInMoodOf(settlementOf({ winner: SIDE.COMPUTER, isAllIn: true }))).toBe('broke');
    expect(allInMoodOf(settlementOf({}))).toBe('none');
    expect(allInMoodOf(null)).toBe('none');
  });
});

describe('스크린리더 머니 안내', () => {
  const money = { [SIDE.ME]: 1_003_200, [SIDE.COMPUTER]: 996_800 };

  it('받은 금액과 양쪽 머니를 읽는다', () => {
    expect(moneyAnnouncement(settlementOf({}), money)).toBe(
      `3,200원을 받았어요. 내 머니 1,003,200원, ${RIVAL_NAME} 머니 996,800원.`,
    );
  });

  it('나가리는 변동 없음을, 빈털터리는 다시 채움을 읽는다', () => {
    expect(moneyAnnouncement(settlementOf({ winner: null, points: 0, amount: 0 }), money)).toMatch(/^머니 변동 없음\./);
    const broke = moneyAnnouncement(settlementOf({ winner: SIDE.COMPUTER, amount: 2_000, isAllIn: true }), money);
    expect(broke).toMatch(/^2,000원을 잃었어요\./);
    expect(broke).toContain('다음 판에 10만 원을 다시 채워 드려요.');
  });

  it('올인 승은 호 사장이 100만 원으로 다시 채운다고 읽는다', () => {
    expect(moneyAnnouncement(settlementOf({ isAllIn: true }), money)).toContain(
      `${RIVAL_NAME}은 다음 판에 100만 원을 다시 채워요.`,
    );
  });

  it('정산이 없으면 아무것도 읽지 않는다', () => {
    expect(moneyAnnouncement(null, money)).toBe('');
    expect(withMoneyLine('내 차례예요.', null, money)).toBe('내 차례예요.');
  });

  it('결과 안내 뒤에 머니 변동을 붙인다', () => {
    expect(withMoneyLine('스톱했어요. 이겼어요! 32점', settlementOf({}), money)).toBe(
      `스톱했어요. 이겼어요! 32점 3,200원을 받았어요. 내 머니 1,003,200원, ${RIVAL_NAME} 머니 996,800원.`,
    );
  });
});

describe('화면에 보이는 지갑', () => {
  const finished = { gameId: 'g1', result: resultOf(SIDE.ME, 32) };

  it('재생이 끝난 판만 정산 대상이다', () => {
    expect(finishedGameOf(PHASE.OVER, finished.result, 'g1', true)).toEqual(finished);
    expect(finishedGameOf(PHASE.OVER, finished.result, 'g1', false)).toBeNull();
    expect(finishedGameOf(PHASE.PLAY, finished.result, 'g1', true)).toBeNull();
    expect(finishedGameOf(PHASE.OVER, null, 'g1', true)).toBeNull();
    expect(finishedGameOf(PHASE.OVER, finished.result, null, true)).toBeNull();
  });

  it('저장 전과 저장 후의 정산 화면이 같다', () => {
    const stored = walletOf(RIVAL_MONEY, RIVAL_MONEY);
    const before = walletView(stored, finished);
    const after = walletView(settleGame(stored, 'g1', finished.result), finished);
    expect(after).toEqual(before);
    expect(settlementOfView(before, finished)).toEqual(settlementOfView(after, finished));
    expect(settlementOfView(before, finished)?.amount).toBe(3_200);
  });

  it('끝난 판이 없으면 저장값 그대로다(0원을 미리 채워 보이지 않는다)', () => {
    const broke = walletOf(0, 200_000);
    expect(walletView(broke, null)).toBe(broke);
    expect(settlementOfView(broke, null)).toBeNull();
  });
});

describe('출석 보너스', () => {
  it('처음 들어온 날 100만 원을 받는다', () => {
    const claim = claimToday(INITIAL_WALLET, at('2026-11-28T09:00:00'));
    expect(claim.bonus).toEqual({ date: '2026-11-28', amount: DAILY_BONUS });
    expect(claim.wallet.money[SIDE.ME]).toBe(DAILY_BONUS);
    expect(claim.wallet.lastBonusDate).toBe('2026-11-28');
  });

  it('같은 날 다시 받지 않고, 다음 날 또 받는다', () => {
    const first = claimToday(INITIAL_WALLET, at('2026-11-28T09:00:00')).wallet;
    const again = claimToday(first, at('2026-11-28T23:59:00'));
    expect(again.bonus).toBeNull();
    expect(again.wallet).toBe(first);
    const tomorrow = claimToday(first, at('2026-11-29T00:01:00'));
    expect(tomorrow.bonus?.date).toBe('2026-11-29');
    expect(tomorrow.wallet.money[SIDE.ME]).toBe(DAILY_BONUS * 2);
  });

  it('상한 가까이 있으면 실제로 더해진 만큼만 알린다', () => {
    const claim = claimToday(walletOf(MONEY_LIMIT - 10, RIVAL_MONEY), at('2026-11-28T09:00:00'));
    expect(claim.wallet.money[SIDE.ME]).toBe(MONEY_LIMIT);
    expect(claim.bonus?.amount).toBe(10);
  });

  it('보너스가 들어오는 동안 지갑은 받기 전 금액부터 올라간다', () => {
    const bonus = { date: '2026-11-28', amount: DAILY_BONUS };
    expect(bonusShownAmount(DAILY_BONUS, bonus, 0)).toBe(0);
    expect(bonusShownAmount(DAILY_BONUS, bonus, DAILY_BONUS)).toBe(DAILY_BONUS);
    expect(bonusShownAmount(DAILY_BONUS, null, 0)).toBe(DAILY_BONUS);
  });

  it('받은 금액을 스크린리더 문장으로 만든다', () => {
    expect(bonusAnnouncement({ date: '2026-11-28', amount: DAILY_BONUS })).toBe(
      '출석 보너스로 1,000,000원을 받았어요.',
    );
    expect(bonusAnnouncement(null)).toBe('');
  });
});
