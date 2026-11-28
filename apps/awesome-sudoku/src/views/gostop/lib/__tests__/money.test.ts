import { SIDE } from '@views/gostop/config/game';
import { DAILY_BONUS, MONEY_LIMIT, RELIEF_MONEY, RIVAL_MONEY, STAKE } from '@views/gostop/config/money';
import {
  canClaimDaily,
  claimDaily,
  dateKeyOf,
  INITIAL_WALLET,
  parseWallet,
  readyWallet,
  settleGame,
  settlementOf,
} from '@views/gostop/lib/money';
import type { GameResult } from '@views/gostop/model/types/gostop';
import type { Wallet } from '@views/gostop/model/types/money';
import { describe, expect, it } from 'vitest';

const win = (winner: GameResult['winner'], points: number): GameResult => ({
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

describe('판돈 정산', () => {
  it('이기면 점수 × 점당 100원만큼 상대 머니를 가져온다', () => {
    const settled = settleGame(walletOf(100_000, 100_000), 'g1', win(SIDE.ME, 32));
    expect(settled.money).toEqual({ [SIDE.ME]: 103_200, [SIDE.COMPUTER]: 96_800 });
    expect(settled.lastSettlement).toEqual({
      winner: SIDE.ME,
      points: 32,
      stake: STAKE,
      amount: 3_200,
      isAllIn: false,
    });
    expect(settled.biggestWin).toBe(3_200);
    expect(settled.bestMoney).toBe(103_200);
  });

  it('지면 내 머니가 줄고 최고 보유액·최대 획득은 그대로다', () => {
    const before = { ...walletOf(100_000, 100_000), bestMoney: 100_000 };
    const settled = settleGame(before, 'g1', win(SIDE.COMPUTER, 7));
    expect(settled.money).toEqual({ [SIDE.ME]: 99_300, [SIDE.COMPUTER]: 100_700 });
    expect(settled.biggestWin).toBe(0);
    expect(settled.bestMoney).toBe(100_000);
  });

  it('진 쪽이 가진 만큼만 넘어가고 0이 되면 올인이다', () => {
    const settlement = settlementOf(walletOf(100_000, 300), win(SIDE.ME, 20));
    expect(settlement).toMatchObject({ amount: 300, isAllIn: true });
    const settled = settleGame(walletOf(100_000, 300), 'g1', win(SIDE.ME, 20));
    expect(settled.money).toEqual({ [SIDE.ME]: 100_300, [SIDE.COMPUTER]: 0 });
  });

  it('나가리는 머니가 움직이지 않는다', () => {
    const settled = settleGame(walletOf(50_000, 150_000), 'g1', win(null, 0));
    expect(settled.money).toEqual({ [SIDE.ME]: 50_000, [SIDE.COMPUTER]: 150_000 });
    expect(settled.lastSettlement?.amount).toBe(0);
  });

  it('같은 판은 한 번만 정산한다', () => {
    const once = settleGame(walletOf(100_000, 100_000), 'g1', win(SIDE.ME, 10));
    expect(settleGame(once, 'g1', win(SIDE.ME, 10))).toBe(once);
  });

  it('양쪽 머니 합은 정산 전후로 같다', () => {
    const after = settleGame(walletOf(4_000, 196_000), 'g1', win(SIDE.COMPUTER, 64));
    expect(after.money.me + after.money.computer).toBe(200_000);
    expect(after.money.me).toBe(0);
  });
});

describe('다시 채우기', () => {
  it('내 머니가 0이면 구제금으로 채우고 횟수를 센다', () => {
    const mine = readyWallet(walletOf(0, 200_000));
    expect(mine.money).toEqual({ [SIDE.ME]: RELIEF_MONEY, [SIDE.COMPUTER]: 200_000 });
    expect(mine.refills).toBe(1);
  });

  it('컴퓨터 머니가 0이면 시작 머니로 채우고 내 횟수는 그대로다', () => {
    const rival = readyWallet(walletOf(200_000, 0));
    expect(rival.money).toEqual({ [SIDE.ME]: 200_000, [SIDE.COMPUTER]: RIVAL_MONEY });
    expect(rival.refills).toBe(0);
  });

  it('머니가 남아 있으면 그대로다', () => {
    const wallet = walletOf(1, 199_999);
    expect(readyWallet(wallet)).toBe(wallet);
  });
});

describe('출석 보너스', () => {
  it('처음 접속하면 0원에서 100만 원을 받는다', () => {
    const claimed = claimDaily(INITIAL_WALLET, '2026-11-28');
    expect(claimed.money).toEqual({ [SIDE.ME]: DAILY_BONUS, [SIDE.COMPUTER]: RIVAL_MONEY });
    expect(claimed.lastBonusDate).toBe('2026-11-28');
    expect(claimed.bestMoney).toBe(DAILY_BONUS);
  });

  it('같은 날에는 다시 받지 못하고 다음 날에는 받는다', () => {
    const claimed = claimDaily(INITIAL_WALLET, '2026-11-28');
    expect(claimDaily(claimed, '2026-11-28')).toBe(claimed);
    expect(claimDaily(claimed, '2026-11-29').money.me).toBe(DAILY_BONUS * 2);
  });

  it('기기 날짜를 과거로 돌리거나 날짜 형식이 아니면 받지 못한다', () => {
    const claimed = claimDaily(INITIAL_WALLET, '2026-11-28');
    expect(canClaimDaily(claimed, '2026-11-27')).toBe(false);
    expect(canClaimDaily(claimed, 'tomorrow')).toBe(false);
    expect(claimDaily(claimed, '2026-1-1')).toBe(claimed);
  });

  it('날짜 키는 기기 현지 날짜의 연-월-일이다', () => {
    expect(dateKeyOf(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dateKeyOf(new Date(2026, 10, 28, 0, 0))).toBe('2026-11-28');
  });
});

describe('저장값 검증', () => {
  it('저장한 지갑을 그대로 읽는다', () => {
    const settled = settleGame(claimDaily(INITIAL_WALLET, '2026-11-28'), 'g1', win(SIDE.ME, 10));
    expect(parseWallet(JSON.parse(JSON.stringify(settled)))).toEqual(settled);
  });

  it('없거나 깨진 값이면 시작 지갑이다', () => {
    const broken: unknown[] = [
      null,
      'x',
      [],
      {},
      { ...INITIAL_WALLET, money: { me: -1, computer: 5 } },
      { ...INITIAL_WALLET, money: { me: 1.5, computer: 5 } },
      { ...INITIAL_WALLET, money: { me: '100', computer: 5 } },
      { ...INITIAL_WALLET, bestMoney: 'many' },
      { ...INITIAL_WALLET, lastGameId: 3 },
      { ...INITIAL_WALLET, lastBonusDate: 'yesterday' },
      { ...INITIAL_WALLET, lastBonusDate: 20261128 },
    ];
    broken.forEach((raw) => expect(parseWallet(raw)).toBe(INITIAL_WALLET));
  });

  it('깨진 마지막 정산은 없음으로 읽는다', () => {
    const parsed = parseWallet({ ...INITIAL_WALLET, lastSettlement: { winner: 'nobody' } });
    expect(parsed.lastSettlement).toBeNull();
  });
});

describe('금액 상한', () => {
  const capWallet = {
    ...INITIAL_WALLET,
    money: { [SIDE.ME]: MONEY_LIMIT - 50, [SIDE.COMPUTER]: RIVAL_MONEY },
    bestMoney: MONEY_LIMIT - 50,
  };
  const win = { winner: SIDE.ME, base: 10, goCount: 0, baks: [], points: 10 } as const;

  it('상한 근처에서 이겨도 상한에서 멈추고 저장값이 그대로 읽힌다', () => {
    const settled = settleGame(capWallet, 'g-cap', win);
    expect(settled.money[SIDE.ME]).toBe(MONEY_LIMIT);
    expect(settled.bestMoney).toBe(MONEY_LIMIT);
    const reread = parseWallet(JSON.parse(JSON.stringify(settled)));
    expect(reread).toEqual(settled);
  });

  it('상한 근처에서 출석 보너스를 받아도 상한에서 멈춘다', () => {
    const claimed = claimDaily(capWallet, '2026-11-28');
    expect(claimed.money[SIDE.ME]).toBe(MONEY_LIMIT);
    expect(parseWallet(JSON.parse(JSON.stringify(claimed)))).toEqual(claimed);
  });

  it('상한을 넘는 저장값은 깨진 값으로 본다', () => {
    const forged = { ...INITIAL_WALLET, money: { [SIDE.ME]: MONEY_LIMIT + 1, [SIDE.COMPUTER]: RIVAL_MONEY } };
    expect(parseWallet(forged)).toBe(INITIAL_WALLET);
  });
});
