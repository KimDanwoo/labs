// 말 모델(Quaternius LowPoly Animated Animals, CC0). public/models/runner.glb 에 둔다.
export const RUNNER_MODEL_URL = '/models/runner.glb';

// 외부 모델 보정(앱 기준: +Z가 정면, 바닥 y=0). 모델마다 달라 여기서 튜닝한다.
// 모델 정면이 진행 방향과 반대면 rotationY를 Math.PI로 뒤집는다.
export const RUNNER_MODEL_TRANSFORM = {
  scale: 1.5,
  rotationY: 0,
  position: [0, 0, 0] as [number, number, number],
};

// useAnimations 클립 키(= glTF 클립 이름). 속도에 따라 idle↔gallop을 섞는다.
export const RUNNER_ANIM = {
  idle: 'AnimalArmature|Idle',
  run: 'AnimalArmature|Gallop',
} as const;

// 달리기 모션 튜닝값.
export const RUNNER_ANIM_TUNING = {
  // 이 속도(m/s) 이상이면 달리는 것으로 본다.
  moveThreshold: 0.4,
  // 달리기 클립이 자연스러운 기준 속도(m/s). 실제 속도 ÷ 이 값 = 재생 배속.
  runRefSpeed: 6,
  // 재생 배속 하한·상한(너무 느리거나 빠르지 않게).
  minRunScale: 0.6,
  maxRunScale: 1.8,
  // idle↔run 가중치 전환 부드러움.
  fadeLerp: 0.18,
} as const;
