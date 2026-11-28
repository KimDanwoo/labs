import { MONEY_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import type { Side } from '@views/gostop/model/types/gostop';

export const COIN_FLIGHT_START_MS = 380;
export const COIN_FLYER_GAP_MS = 110;
export const COIN_FLYER_COUNT = 5;
export const PURSE_LANDING_MS = 1_000;
export const COIN_RAIN_START_MS = 200;

export const COIN_FLYERS = Array.from({ length: COIN_FLYER_COUNT }, (_, index) => index);

export const COIN_RAIN = [
  { left: 4, delayMs: 60, spin: 540 },
  { left: 13, delayMs: 300, spin: -420 },
  { left: 21, delayMs: 140, spin: 600 },
  { left: 30, delayMs: 420, spin: -540 },
  { left: 38, delayMs: 0, spin: 480 },
  { left: 47, delayMs: 240, spin: -600 },
  { left: 56, delayMs: 80, spin: 420 },
  { left: 64, delayMs: 360, spin: -480 },
  { left: 73, delayMs: 180, spin: 560 },
  { left: 81, delayMs: 460, spin: -420 },
  { left: 89, delayMs: 20, spin: 500 },
  { left: 95, delayMs: 280, spin: -560 },
] as const;

export const PURSE_NAME: Record<Side, string> = {
  [SIDE.ME]: MONEY_COPY.me,
  [SIDE.COMPUTER]: MONEY_COPY.rival,
};

export const PURSE_LABEL: Record<Side, string> = {
  [SIDE.ME]: MONEY_COPY.myPurse,
  [SIDE.COMPUTER]: MONEY_COPY.rivalPurse,
};

export const MOOD_CAPTION = {
  jackpot: { badge: MONEY_COPY.allInStamp, note: `${MONEY_COPY.allInLine} ${MONEY_COPY.allInNote}` },
  broke: { badge: MONEY_COPY.brokeStamp, note: MONEY_COPY.brokeNote },
} as const;

export const MONEY_RECORD_FIELDS = [
  { key: 'bestMoney', label: MONEY_COPY.bestMoney },
  { key: 'biggestWin', label: MONEY_COPY.biggestWin },
] as const;

export const BONUS_TOAST_MS = 4_200;
export const BONUS_COINS = [0, 1, 2, 3, 4] as const;
