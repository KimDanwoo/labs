export const REVEAL_DELAY_MS = {
  divider: 240,
  intro: 300,
  projectsHeader: 360,
  firstCard: 420,
} as const;

export const CARD_STAGGER_MS = 60;

export const WORD_REVEAL = { startDelayMs: 120, staggerMs: 110 } as const;

export const SCRAMBLE_TIMING = { firstHoldMs: 1900, holdMs: 1700, glyphFrameMs: 35 } as const;

export const MIN_SCRAMBLE_KEYWORDS = 2;

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
