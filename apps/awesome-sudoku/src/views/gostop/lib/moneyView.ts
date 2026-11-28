import { BONUS_COPY, GOSTOP_COPY, MONEY_COPY } from '@views/gostop/config/copy';
import { PHASE, SIDE } from '@views/gostop/config/game';
import { STAKE } from '@views/gostop/config/money';
import { claimDaily, dateKeyOf, settleGame, settlementOf } from '@views/gostop/lib/money';
import type { Bak, GameResult, Phase, Side } from '@views/gostop/model/types/gostop';
import type { Settlement, Wallet } from '@views/gostop/model/types/money';

export type MoneyFlow = 'gain' | 'loss' | 'even';
export type AllInMood = 'jackpot' | 'broke' | 'none';

export interface FinishedGame {
  gameId: string;
  result: GameResult;
}

export interface SettlementLine {
  flow: MoneyFlow;
  formula: string;
  isCapped: boolean;
}

export interface StopPayout {
  points: number;
  amount: number;
  isCapped: boolean;
  baks: readonly Bak[];
}

export interface DailyBonus {
  date: string;
  amount: number;
}

export interface BonusClaim {
  wallet: Wallet;
  bonus: DailyBonus | null;
}

const MONEY_FORMAT = new Intl.NumberFormat('ko-KR');

const FLOW_SIGN: Record<MoneyFlow, string> = { gain: MONEY_COPY.plus, loss: MONEY_COPY.minus, even: '' };
const FLOW_VERB: Record<MoneyFlow, string> = { gain: MONEY_COPY.gained, loss: MONEY_COPY.lost, even: '' };
const CAPPED_NOTE: Record<MoneyFlow, string> = {
  gain: MONEY_COPY.cappedGain,
  loss: MONEY_COPY.cappedLoss,
  even: '',
};
const MOOD_LINE: Record<AllInMood, string> = {
  jackpot: `${MONEY_COPY.allInTitle}. ${MONEY_COPY.allInNote}`,
  broke: `${MONEY_COPY.brokeTitle}. ${MONEY_COPY.brokeNote}`,
  none: '',
};

export const formatAmount = (amount: number): string => MONEY_FORMAT.format(amount);

export const formatMoney = (amount: number): string => `${formatAmount(amount)}${MONEY_COPY.unit}`;

export function flowOf(settlement: Settlement, side: Side = SIDE.ME): MoneyFlow {
  const isEven = settlement.winner === null || settlement.amount === 0;
  if (isEven) return 'even';
  return settlement.winner === side ? 'gain' : 'loss';
}

export const signedMoney = (amount: number, flow: MoneyFlow): string => `${FLOW_SIGN[flow]}${formatMoney(amount)}`;

export function sideDelta(settlement: Settlement | null, side: Side): string {
  if (!settlement) return '';
  const flow = flowOf(settlement, side);
  return flow === 'even' ? '' : signedMoney(settlement.amount, flow);
}

export function settlementLine(settlement: Settlement): SettlementLine {
  const { points, stake, amount } = settlement;
  const full = points * stake;
  return {
    flow: flowOf(settlement),
    formula: `${points}${GOSTOP_COPY.points} ${MONEY_COPY.times} ${formatMoney(stake)} ${MONEY_COPY.equals} ${formatMoney(full)}`,
    isCapped: amount < full,
  };
}

export const cappedNote = (line: SettlementLine, amount: number): string =>
  line.isCapped ? `${CAPPED_NOTE[line.flow]} (${formatMoney(amount)})` : '';

export function stopPayout(wallet: Wallet, result: GameResult): StopPayout {
  const { points, amount } = settlementOf(wallet, result);
  return { points, amount, isCapped: amount < points * STAKE, baks: result.baks };
}

export function allInMoodOf(settlement: Settlement | null): AllInMood {
  if (!settlement?.isAllIn) return 'none';
  return settlement.winner === SIDE.ME ? 'jackpot' : 'broke';
}

export function moneyAnnouncement(settlement: Settlement | null, money: Record<Side, number>): string {
  if (!settlement) return '';
  const flow = flowOf(settlement);
  const change = flow === 'even' ? `${MONEY_COPY.noChange}.` : `${formatAmount(settlement.amount)}${FLOW_VERB[flow]}`;
  const balance = `${MONEY_COPY.balance} ${formatMoney(money[SIDE.ME])}, ${MONEY_COPY.rivalBalance} ${formatMoney(money[SIDE.COMPUTER])}.`;
  return [change, balance, MOOD_LINE[allInMoodOf(settlement)]].filter(Boolean).join(' ');
}

export const bonusAnnouncement = (bonus: DailyBonus | null): string =>
  bonus ? `${BONUS_COPY.announce} ${formatMoney(bonus.amount)}${BONUS_COPY.received}` : '';

export const withMoneyLine = (announcement: string, settlement: Settlement | null, money: Record<Side, number>) =>
  [announcement, moneyAnnouncement(settlement, money)].filter(Boolean).join(' ');

export function finishedGameOf(
  phase: Phase,
  result: GameResult | null,
  gameId: string | null,
  isSettled: boolean,
): FinishedGame | null {
  const isOver = isSettled && phase === PHASE.OVER;
  if (!isOver) return null;
  if (!result) return null;
  if (!gameId) return null;
  return { gameId, result };
}

export const walletView = (stored: Wallet, finished: FinishedGame | null): Wallet =>
  finished ? settleGame(stored, finished.gameId, finished.result) : stored;

export const settlementOfView = (wallet: Wallet, finished: FinishedGame | null): Settlement | null =>
  finished ? wallet.lastSettlement : null;

export const bonusShownAmount = (money: number, bonus: DailyBonus | null, counted: number): number =>
  bonus ? money - bonus.amount + counted : money;

export function claimToday(wallet: Wallet, now: () => Date): BonusClaim {
  const date = dateKeyOf(now());
  const next = claimDaily(wallet, date);
  if (next === wallet) return { wallet, bonus: null };
  return { wallet: next, bonus: { date, amount: next.money[SIDE.ME] - wallet.money[SIDE.ME] } };
}
