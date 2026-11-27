export const TIMER_TICK_MS = 1000;

export const TIMER_STATE = { completed: 'completed', running: 'running', paused: 'paused' } as const;

export type TimerState = (typeof TIMER_STATE)[keyof typeof TIMER_STATE];

export const TIMER_BUTTON_TONE: Record<TimerState, string> = {
  completed: 'cursor-not-allowed opacity-40',
  running: '',
  paused: 'bg-primary text-on-primary hover:text-on-primary',
};

export const TIMER_COPY = {
  elapsed: '걸린 시간',
  pause: '일시정지',
  play: '재생',
} as const;
