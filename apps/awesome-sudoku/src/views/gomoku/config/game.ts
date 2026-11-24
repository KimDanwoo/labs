export const GAME_ACTION = {
  PLACE: 'place',
  UNDO: 'undo',
  RESET: 'reset',
  SELECT_STONE: 'selectStone',
} as const;

export const OUTCOME = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
  DRAW: 'draw',
} as const;
