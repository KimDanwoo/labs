import { SIDE } from '@views/gostop/config/game';
import { DAILY_BONUS, MONEY_LIMIT, RELIEF_MONEY, RIVAL_MONEY, STAKE } from '@views/gostop/config/money';
import { rivalOf } from '@views/gostop/lib/cards';
import { isPlainObject } from '@views/gostop/lib/storage';
import type { GameResult, Side } from '@views/gostop/model/types/gostop';
import type { Settlement, Wallet } from '@views/gostop/model/types/money';

export const INITIAL_WALLET: Wallet = {
  money: { [SIDE.ME]: 0, [SIDE.COMPUTER]: RIVAL_MONEY },
  bestMoney: 0,
  biggestWin: 0,
  refills: 0,
  lastGameId: null,
  lastBonusDate: null,
  lastSettlement: null,
};

const SIDES: readonly Side[] = [SIDE.ME, SIDE.COMPUTER];
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PART_WIDTH = 2;

const isAmount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= MONEY_LIMIT;
const capped = (amount: number): number => Math.min(amount, MONEY_LIMIT);
const isSide = (value: unknown): value is Side => SIDES.some((side) => side === value);
const isGameId = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isDateKey = (value: unknown): value is string => typeof value === 'string' && DATE_KEY.test(value);
const isBonusDate = (value: unknown): value is string | null => value === null || isDateKey(value);

function parseMoney(raw: unknown): Record<Side, number> | null {
  if (!isPlainObject(raw)) return null;
  const { me, computer } = raw;
  const isValid = isAmount(me) && isAmount(computer);
  return isValid ? { [SIDE.ME]: me, [SIDE.COMPUTER]: computer } : null;
}

function parseSettlement(raw: unknown): Settlement | null {
  if (!isPlainObject(raw)) return null;
  const { winner, points, stake, amount, isAllIn } = raw;
  const hasWinner = winner === null || isSide(winner);
  const hasAmounts = isAmount(points) && isAmount(stake) && isAmount(amount);
  const isValid = hasWinner && hasAmounts && typeof isAllIn === 'boolean';
  return isValid ? { winner, points, stake, amount, isAllIn } : null;
}

export function parseWallet(raw: unknown): Wallet {
  if (!isPlainObject(raw)) return INITIAL_WALLET;
  const money = parseMoney(raw.money);
  const { bestMoney, biggestWin, refills, lastGameId, lastBonusDate } = raw;
  const hasCounts = isAmount(bestMoney) && isAmount(biggestWin) && isAmount(refills);
  const hasMarks = isGameId(lastGameId) && isBonusDate(lastBonusDate);
  const isValid = money !== null && hasCounts && hasMarks;
  if (!isValid) return INITIAL_WALLET;
  return {
    money,
    bestMoney,
    biggestWin,
    refills,
    lastGameId,
    lastBonusDate,
    lastSettlement: parseSettlement(raw.lastSettlement),
  };
}

export function settlementOf(wallet: Wallet, result: GameResult): Settlement {
  const { winner, points } = result;
  const stake = STAKE;
  if (winner === null) return { winner, points: 0, stake, amount: 0, isAllIn: false };
  const loserMoney = wallet.money[rivalOf(winner)];
  const amount = Math.min(points * stake, loserMoney);
  return { winner, points, stake, amount, isAllIn: amount === loserMoney };
}

function transfer(money: Record<Side, number>, { winner, amount }: Settlement): Record<Side, number> {
  if (winner === null) return money;
  const loser = rivalOf(winner);
  return { ...money, [winner]: capped(money[winner] + amount), [loser]: money[loser] - amount };
}

export function settleGame(wallet: Wallet, gameId: string, result: GameResult): Wallet {
  if (wallet.lastGameId === gameId) return wallet;
  const settlement = settlementOf(wallet, result);
  const money = transfer(wallet.money, settlement);
  const myWin = settlement.winner === SIDE.ME ? settlement.amount : 0;
  return {
    ...wallet,
    money,
    bestMoney: Math.max(wallet.bestMoney, money[SIDE.ME]),
    biggestWin: Math.max(wallet.biggestWin, myWin),
    lastGameId: gameId,
    lastSettlement: settlement,
  };
}

export function readyWallet(wallet: Wallet): Wallet {
  const isMineEmpty = wallet.money[SIDE.ME] === 0;
  const isRivalEmpty = wallet.money[SIDE.COMPUTER] === 0;
  const isBroke = isMineEmpty || isRivalEmpty;
  if (!isBroke) return wallet;
  return {
    ...wallet,
    money: {
      [SIDE.ME]: isMineEmpty ? RELIEF_MONEY : wallet.money[SIDE.ME],
      [SIDE.COMPUTER]: isRivalEmpty ? RIVAL_MONEY : wallet.money[SIDE.COMPUTER],
    },
    refills: wallet.refills + (isMineEmpty ? 1 : 0),
  };
}

const padded = (value: number): string => String(value).padStart(DATE_PART_WIDTH, '0');

export const dateKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;

export function canClaimDaily(wallet: Wallet, today: string): boolean {
  if (!isDateKey(today)) return false;
  return wallet.lastBonusDate === null || today > wallet.lastBonusDate;
}

export function claimDaily(wallet: Wallet, today: string): Wallet {
  if (!canClaimDaily(wallet, today)) return wallet;
  const mine = capped(wallet.money[SIDE.ME] + DAILY_BONUS);
  return {
    ...wallet,
    money: { ...wallet.money, [SIDE.ME]: mine },
    bestMoney: Math.max(wallet.bestMoney, mine),
    lastBonusDate: today,
  };
}
