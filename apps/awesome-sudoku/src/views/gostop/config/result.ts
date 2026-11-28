export const COUNT_UP_MS = 900;
export const STAMP_START_MS = 950;
export const STAMP_GAP_MS = 260;

export const CONFETTI_START_MS = 260;

export const CONFETTI = [
  { left: 6, delayMs: 0, tone: 'red', turn: 320 },
  { left: 14, delayMs: 180, tone: 'ink', turn: -260 },
  { left: 22, delayMs: 60, tone: 'blue', turn: 400 },
  { left: 31, delayMs: 260, tone: 'white', turn: -340 },
  { left: 39, delayMs: 120, tone: 'red', turn: 280 },
  { left: 47, delayMs: 320, tone: 'blue', turn: -420 },
  { left: 55, delayMs: 40, tone: 'ink', turn: 360 },
  { left: 63, delayMs: 220, tone: 'white', turn: -300 },
  { left: 71, delayMs: 100, tone: 'red', turn: 440 },
  { left: 79, delayMs: 300, tone: 'blue', turn: -380 },
  { left: 87, delayMs: 20, tone: 'white', turn: 260 },
  { left: 94, delayMs: 200, tone: 'ink', turn: -320 },
] as const;

export const CONFETTI_TONE = {
  red: 'bg-hwatu-red',
  blue: 'bg-hwatu-blue',
  ink: 'bg-ink',
  white: 'bg-white',
} as const;
