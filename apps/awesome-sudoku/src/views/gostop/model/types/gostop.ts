import type { CARD_KIND, RIBBON } from '@views/gostop/config/cards';
import type { CHOICE_SOURCE, GAME_ACTION, PHASE, SIDE, TURN_EVENT } from '@views/gostop/config/game';

export type CardKind = (typeof CARD_KIND)[keyof typeof CARD_KIND];
export type Ribbon = (typeof RIBBON)[keyof typeof RIBBON];
export type Side = (typeof SIDE)[keyof typeof SIDE];
export type Phase = (typeof PHASE)[keyof typeof PHASE];
export type TurnEvent = (typeof TURN_EVENT)[keyof typeof TURN_EVENT];
export type ChoiceSource = (typeof CHOICE_SOURCE)[keyof typeof CHOICE_SOURCE];
export type Bak = 'piBak' | 'gwangBak' | 'meongTta' | 'goBak';

export interface CardSpec {
  kind: CardKind;
  ribbon?: Ribbon;
  piValue?: number;
  isGodori?: boolean;
  isRainGwang?: boolean;
}

export interface HwatuCard {
  id: number;
  month: number;
  kind: CardKind;
  ribbon: Ribbon | null;
  piValue: number;
  isGodori: boolean;
  isRainGwang: boolean;
}

export interface Table {
  hands: Record<Side, readonly number[]>;
  floor: readonly number[];
  deck: readonly number[];
  captured: Record<Side, readonly number[]>;
}

export interface TurnReport {
  side: Side;
  played: number;
  flipped: number | null;
  taken: readonly number[];
  stolen: readonly number[];
  events: readonly TurnEvent[];
}

export interface FloorChoice {
  source: ChoiceSource;
  card: number;
  options: readonly number[];
}

export interface PendingPlay {
  card: number;
  picks: readonly number[];
  choice: FloorChoice;
}

export interface ScoreBreakdown {
  gwang: number;
  yeol: number;
  tti: number;
  pi: number;
  godori: number;
  dan: number;
  total: number;
}

export interface GameResult {
  winner: Side | null;
  base: number;
  goCount: number;
  baks: readonly Bak[];
  points: number;
}

export interface GameState {
  phase: Phase;
  table: Table;
  turn: Side;
  goCount: Record<Side, number>;
  goScore: Record<Side, number>;
  lastTurn: TurnReport | null;
  pending: PendingPlay | null;
  result: GameResult | null;
}

export type GameAction =
  | { type: typeof GAME_ACTION.DEAL; deck: readonly number[] }
  | { type: typeof GAME_ACTION.PLAY; side: Side; card: number; picks?: readonly number[] }
  | { type: typeof GAME_ACTION.CHOOSE; side: Side; pick: number }
  | { type: typeof GAME_ACTION.GO; side: Side }
  | { type: typeof GAME_ACTION.STOP; side: Side }
  | { type: typeof GAME_ACTION.RESET };
