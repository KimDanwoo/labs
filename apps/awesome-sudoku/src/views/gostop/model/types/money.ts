import type { Side } from '@views/gostop/model/types/gostop';

export interface Settlement {
  winner: Side | null;
  points: number;
  stake: number;
  amount: number;
  isAllIn: boolean;
}

export interface Wallet {
  money: Record<Side, number>;
  bestMoney: number;
  biggestWin: number;
  refills: number;
  lastGameId: string | null;
  lastBonusDate: string | null;
  lastSettlement: Settlement | null;
}
