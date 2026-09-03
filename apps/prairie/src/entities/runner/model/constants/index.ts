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

// 천마 룩: 모델 머티리얼 이름별 색 덮어쓰기(원본 glb는 그대로).
export const UNICORN_TINT: Record<string, string> = {
  Main: '#f6f3ff',
  Main_Light: '#ffffff',
  Hair: '#c9b8ff',
  Hooves: '#d9c9ff',
};

// 뿔: Head 뼈에 붙인다. 뼈에 스케일 100이 들어 있어 자식은 boneScaleFix로 보정.
// 위치·회전은 Head 로컬(+Z = 위·앞, +Y = 코 방향) 기준 모델 단위. 실측: 뼈 원점(0,4.18,2.53) → 이마 위(0,4.6,2.9).
export const HORN = {
  boneScaleFix: 0.01,
  position: [0, 0.05, 0.56] as [number, number, number],
  tiltForward: -0.1,
  radius: 0.11,
  height: 1.1,
  color: '#fff3c9',
  glowColor: '#ffd98a',
  glowScale: 1.6,
} as const;

// 빛의 날개: 말 루트에 좌우 한 쌍. 지상에선 접혀 희미하고, 공중·질주 시 펼쳐진다.
// 실측(모델 단위): 등 최고점 y 3.61, 몸통 z -1.94~3.47 → 어깨 위(±0.55, 3.45, 0.9)에서 시작.
// 끝이 처지는 곡면(droop)이라 카메라가 아래·뒤에 있어도 면이 보인다. 뒤로 젖힘(sweep).
export const WINGS = {
  span: 5.2,
  chord: 2.3,
  root: [0.55, 3.45, 0.9] as [number, number, number],
  droop: 1.4,
  sweep: 0.35,
  foldedAngle: 1.2,
  foldedScale: 0.35,
  foldedOpacity: 0.1,
  openAngleBase: 0.2,
  flapAmplitude: 0.45,
  flapSpeedGround: 1.6,
  flapSpeedSprint: 3.2,
  flapSpeedAir: 5,
  flapSpeedRising: 10,
  openLerp: 0.08,
  colorRoot: '#fffaf0',
  colorTip: '#ffd27a',
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

// 물속을 달릴 때의 물보라·파문. 세기(0~1)는 속도 ÷ fullSplashSpeed, 수심 minDepth 이상일 때만.
export const WADE_SPLASH = {
  minDepth: 0.05,
  minSpeed: 0.8,
  fullSplashSpeed: 10,
  // 물보라: 속도 방향으로 늘어난 물줄기. 세기 1일 때 초당 방출 수.
  maxDroplets: 256,
  emitPerSecond: 320,
  dropletMinSize: 0.08,
  dropletMaxSize: 0.26,
  upSpeedMin: 2.5,
  upSpeedMax: 7,
  sideSpeedMax: 3.2,
  forwardCarry: 0.35,
  stretchPerSpeed: 0.22,
  lifeMin: 0.45,
  lifeMax: 0.8,
  gravity: 12,
  spreadRadius: 1,
  // 물에 착지하면 한 번에 터지는 물보라 수.
  landingBurst: 90,
  // 파문 링: 일정 간격으로 발굽에서 퍼져나간다.
  ringCount: 6,
  ringInterval: 0.14,
  ringLife: 1.1,
  ringStartRadius: 0.6,
  ringEndRadius: 3.4,
  ringOpacity: 0.55,
} as const;

// 질주 중 발굽에서 흩날리는 금빛 잔광. 뒤로 흘러가며 작아진다.
export const SPRINT_TRAIL = {
  maxMotes: 120,
  emitPerSecond: 90,
  minSpeed: 5,
  sizeMin: 0.06,
  sizeMax: 0.16,
  lifeMin: 0.5,
  lifeMax: 1,
  backwardCarry: 0.12,
  rise: 0.9,
  jitter: 0.7,
  spawnHeight: 0.35,
  // 이 높이 이상 떠 있으면 질주 여부와 무관하게 방출(비행 잔광).
  flyingHeight: 0.5,
  color: '#ffd27a',
} as const;
