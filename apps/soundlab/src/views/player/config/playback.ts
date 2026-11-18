export const WIDGET_EVENT = {
  ready: 'ready',
  play: 'play',
  pause: 'pause',
  finish: 'finish',
  progress: 'playProgress',
  buffer: 'loadProgress',
  error: 'error',
} as const;

/** ready가 이 안에 안 오면 엔진이 막힌 것으로 본다 — w.soundcloud.com은 광고 차단기가 흔히 막는다. */
export const READY_TIMEOUT_MS = 10_000;

export const SAVE_INTERVAL_MS = 5000;
export const RESUME_TAIL_MS = 5000;
export const REWIND_TOLERANCE_MS = 1500;
export const REWIND_WATCH_MS = 2000;
export const REWIND_ATTEMPT_LIMIT = 3;
export const LISTEN_STEP_LIMIT_MS = 5000;
export const SESSION_EVENT_LIMIT = 2;

export const PLAYBACK_MESSAGE = {
  engineBlocked: '재생 엔진이 응답하지 않습니다. 광고 차단기가 soundcloud.com을 막고 있는지 확인해 주세요.',
  engineFailed: '재생 엔진을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.',
  trackFailed: '곡을 재생할 수 없습니다. 잠시 후 다시 시도해 주세요.',
} as const;
