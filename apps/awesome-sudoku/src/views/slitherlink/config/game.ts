import { SLITHERLINK_LEVEL } from '@views/slitherlink/config/difficulty';
import type { SlitherlinkLevel } from '@views/slitherlink/model/types/slitherlink';

export const HINTS_PER_GAME = 10;

export const INITIAL_LEVEL: SlitherlinkLevel = SLITHERLINK_LEVEL.EASY;

export const GAME_PHASE = {
  GENERATING: 'generating',
  PLAYING: 'playing',
  SOLVED: 'solved',
} as const;

export const STROKE_MODE = {
  DRAW: 'draw',
  ERASE: 'erase',
} as const;

export const GAME_ACTION = {
  GENERATE: 'generate',
  LOADED: 'loaded',
  TAP_EDGE: 'tapEdge',
  STROKE_BEGIN: 'strokeBegin',
  STROKE_TO: 'strokeTo',
  STROKE_END: 'strokeEnd',
  STROKE_CANCEL: 'strokeCancel',
  UNDO: 'undo',
  REDO: 'redo',
  HINT: 'hint',
} as const;

export const STROKE_FOLLOW_UP_ACTIONS: ReadonlySet<string> = new Set([
  GAME_ACTION.STROKE_TO,
  GAME_ACTION.STROKE_END,
  GAME_ACTION.STROKE_CANCEL,
]);

export const LEVEL_LABEL: Record<SlitherlinkLevel, string> = {
  [SLITHERLINK_LEVEL.EASY]: '쉬움',
  [SLITHERLINK_LEVEL.MEDIUM]: '중간',
  [SLITHERLINK_LEVEL.HARD]: '어려움',
};

export const LEVEL_OPTIONS: readonly SlitherlinkLevel[] = Object.values(SLITHERLINK_LEVEL);
