export const GAME_ACTION = {
  PLAY: 'play',
  UNDO: 'undo',
  RESET: 'reset',
} as const;

export const OUTCOME = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
  DRAW: 'draw',
} as const;

export const STEP = {
  THINKING: 'thinking',
  PICK_PAWN: 'pickPawn',
  PICK_CELL: 'pickCell',
  PICK_WALL: 'pickWall',
} as const;
