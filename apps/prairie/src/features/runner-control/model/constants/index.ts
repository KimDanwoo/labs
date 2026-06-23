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
  accel: 22,
  brake: 30,
  coastDecel: 14,
  maxSpeed: 22,
  maxReverse: 6,
  steerRate: 2.8,
  // 멈춰 있어도 이 정도는 제자리에서 방향을 틀 수 있다(사람은 회전 가능).
  turnFloor: 0.3,
  speedToKmh: 3.6,
} as const;

// PC: 캔버스를 마우스로 끌어 카메라를 좌우로 회전(yaw). px 이동량 × 감도(rad).
export const VIEW_LOOK = {
  sensitivity: 0.005,
} as const;

// 모바일: 손 댄 자리에 생기는 플로팅 조이스틱. 단위는 px(화면 좌표 기준).
// 중심에서 maxRadius까지 knob이 따라오고, deadzone을 넘긴 축만 액션으로 친다.
export const JOYSTICK = {
  maxRadius: 52,
  deadzone: 14,
} as const;
