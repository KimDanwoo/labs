import type { BadgeTone } from '@shared/config/badgeStyle';

export type GameStatus = 'ready' | 'myTurn' | 'rivalTurn' | 'deciding' | 'over';

export type Outcome = 'win' | 'lose' | 'draw';

export type CardMark =
  'gwang' | 'rainGwang' | 'godori' | 'yeol' | 'hong' | 'cheong' | 'cho' | 'plain' | 'ssangPi' | 'pi';

export type Entrance = 'deal' | 'fromMe' | 'fromRival' | 'flip';

export type HandCardState = 'match' | 'open' | 'waiting';

export interface TurnChip {
  key: string;
  label: string;
  tone: BadgeTone;
}

export type BakRisk = 'piBak' | 'gwangBak';
