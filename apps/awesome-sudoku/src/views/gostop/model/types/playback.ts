import type { FLIGHT_ORIGIN, MOTION, PLAYBACK_ACTION, SPEED, STEP_KIND } from '@views/gostop/config/playback';
import type { GameAction, GameState, Side, Table } from '@views/gostop/model/types/gostop';

export type StepKind = (typeof STEP_KIND)[keyof typeof STEP_KIND];
export type Speed = (typeof SPEED)[keyof typeof SPEED];
export type Motion = (typeof MOTION)[keyof typeof MOTION];
export type FlightOrigin = (typeof FLIGHT_ORIGIN)[keyof typeof FLIGHT_ORIGIN];

export type SoundName =
  'deal' | 'place' | 'flip' | 'match' | 'capture' | 'steal' | 'cutIn' | 'go' | 'stop' | 'win' | 'lose' | 'draw';

export type CutInTone = 'mine' | 'rival';

export interface CutIn {
  label: string;
  tone: CutInTone;
}

export interface PlaybackStep {
  kind: StepKind;
  side: Side | null;
  table: Table;
  revealed: number | null;
  gathering: readonly number[];
  sound: SoundName | null;
  cutIn: CutIn | null;
  durationMs: number;
}

export interface PlaybackState {
  game: GameState;
  steps: readonly PlaybackStep[];
  cursor: number;
  gameId: string | null;
  announcement: string;
}

export type PlaybackAction =
  | { type: typeof PLAYBACK_ACTION.APPLY; action: GameAction; motion: Motion; gameId?: string }
  | { type: typeof PLAYBACK_ACTION.ADVANCE; steps: readonly PlaybackStep[] };
