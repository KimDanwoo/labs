import {
  COIN_FLIGHT_START_MS,
  COIN_FLYER_GAP_MS,
  COIN_RAIN_START_MS,
  PURSE_LANDING_MS,
} from '@views/gostop/config/purse';
import type { CSSProperties } from 'react';

export interface CoinDrop {
  left: number;
  delayMs: number;
  spin: number;
}

export const coinFlyerStyle = (index: number): CSSProperties => ({
  animationDelay: `${COIN_FLIGHT_START_MS + index * COIN_FLYER_GAP_MS}ms`,
});

export const purseLandingStyle: CSSProperties = { animationDelay: `${PURSE_LANDING_MS}ms` };

type CoinRainStyle = CSSProperties & Record<'--spin', string>;

export const coinRainStyle = ({ left, delayMs, spin }: CoinDrop): CoinRainStyle => ({
  left: `${left}%`,
  animationDelay: `${delayMs + COIN_RAIN_START_MS}ms`,
  '--spin': `${spin}deg`,
});
