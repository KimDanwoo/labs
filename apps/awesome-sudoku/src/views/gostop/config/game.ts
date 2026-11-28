export const SIDE = {
  ME: 'me',
  COMPUTER: 'computer',
} as const;

export const PHASE = {
  READY: 'ready',
  PLAY: 'play',
  CHOOSE: 'choose',
  DECIDE: 'decide',
  OVER: 'over',
} as const;

export const GAME_ACTION = {
  DEAL: 'deal',
  PLAY: 'play',
  CHOOSE: 'choose',
  GO: 'go',
  STOP: 'stop',
  RESET: 'reset',
} as const;

export const CHOICE_SOURCE = {
  PLAYED: 'played',
  FLIPPED: 'flipped',
} as const;

export const TURN_EVENT = {
  JJOK: 'jjok',
  PPUK: 'ppuk',
  TTADAK: 'ttadak',
  COLLECT: 'collect',
  SWEEP: 'sweep',
} as const;

export const STEALING_EVENTS: ReadonlySet<string> = new Set([
  TURN_EVENT.JJOK,
  TURN_EVENT.TTADAK,
  TURN_EVENT.COLLECT,
  TURN_EVENT.SWEEP,
]);

export const HAND_SIZE = 10;
export const FLOOR_SIZE = 8;
export const COMPUTER_DELAY_MS = 700;
export const KEYBOARD_CLICK_DETAIL = 0;
