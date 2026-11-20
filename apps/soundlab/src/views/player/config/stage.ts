export const ARTWORK_TEXTURE_SIZE = 't500x500';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const RIPPLE_MS = 900;

export const BEAT_RIPPLE = { ms: 480, amp: 0.7, spread: 0.62 } as const;

export const CLICK_RIPPLE_AMP = 1;

export const FRAME = { referenceMs: 16.7, maxStep: 3, minSpeedStep: 0.2 } as const;

export const MORPH = { initial: 0.001, inRate: 0.038, outRate: 0.075, swapThreshold: 0.02 } as const;

export const TRAIL = { speedGain: 140, ease: 0.14 } as const;

export const DECAY = { max: 0.88, trail: 0.86, energy: 0.24 } as const;
