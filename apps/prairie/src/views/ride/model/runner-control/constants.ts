export type RunnerAction = 'forward' | 'backward' | 'left' | 'right' | 'sprint' | 'jump' | 'spin' | 'dash' | 'descend';

export const KEY_BINDINGS: Record<string, RunnerAction> = {
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  Space: 'jump',
  KeyE: 'spin',
  KeyQ: 'dash',
  KeyC: 'descend',
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export const RUNNER_PHYSICS = {
  accel: 9,
  brake: 14,
  coastDecel: 6,
  maxSpeed: 12,
  maxReverse: 3,
  steerRate: 2.8,
  turnFloor: 0.3,
  sprintMaxMultiplier: 1.6,
  sprintAccelMultiplier: 1.5,
} as const;

export const VIEW_LOOK = {
  sensitivity: 0.005,
  pitchSensitivity: 0.003,
  minPitch: -0.25,
  maxPitch: 0.65,
} as const;

export const JOYSTICK = {
  maxRadius: 52,
  deadzone: 14,
} as const;
