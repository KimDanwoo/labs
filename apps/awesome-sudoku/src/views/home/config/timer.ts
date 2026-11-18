export const TIMER_TICK_MS = 1000;

export const TIMER_ICON_SIZE = 14;

export const TIMER_STATE = { completed: 'completed', running: 'running', paused: 'paused' } as const;

export type TimerState = (typeof TIMER_STATE)[keyof typeof TIMER_STATE];
