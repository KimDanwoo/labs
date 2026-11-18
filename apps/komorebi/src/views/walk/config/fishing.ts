export const BITE_WAIT_MS = { min: 2500, range: 3500 } as const;

export const PERFECT_HOOK_WINDOW_MS = 450;

export const VIBRATION = { bite: [25, 50, 25], hook: [25, 30, 60], landed: [40, 30, 80], lost: 90 } as const;

export const FIGHT_TICK_MS = 50;

export const FIGHT_GAUGE_MAX = 100;

export const TENSION = { optimum: 50, low: 20, high: 80, slack: 25, strain: 75 } as const;

export const REEL_KEYS: readonly string[] = ['Space', 'Enter', 'KeyE'];

export const REEL_KEY = 'KeyE';

export const FISHING_FAILURE = {
  default: '물고기가 달아났어요. 다시 해 볼까요?',
  snapped: '팽! 너무 당겨 줄이 끊어졌어요.',
  escaped: '줄이 느슨해져 물고기가 빠져나갔어요.',
} as const;
