export type RunnerAction = 'forward' | 'backward' | 'left' | 'right';

// event.code → 이동 액션. WASD + 방향키 동시 지원.
export const KEY_BINDINGS: Record<string, RunnerAction> = {
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
  accel: 14,
  brake: 22,
  coastDecel: 16,
  maxSpeed: 12,
  maxReverse: 4,
  steerRate: 2.4,
  // 멈춰 있어도 이 정도는 제자리에서 방향을 틀 수 있다(사람은 회전 가능).
  turnFloor: 0.3,
  speedToKmh: 3.6,
} as const;
