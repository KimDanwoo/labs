// Quaternius(CC0) 원본에 곡면 세분화·꼬리 털 다발을 적용한 파생 모델. scripts/refine-runner.mjs로 재생성한다.
export const RUNNER_MODEL_URL = '/models/unicorn.glb';

// 외부 모델 보정(앱 기준: +Z가 정면, 바닥 y=0). 모델마다 달라 여기서 튜닝한다.
// 모델 정면이 진행 방향과 반대면 rotationY를 Math.PI로 뒤집는다.
export const RUNNER_MODEL_TRANSFORM = {
  scale: 0.55,
  rotationY: 0,
  position: [0, 0, 0] as [number, number, number],
};

// 원본 리그의 대기·걷기·갤럽·공중 포즈를 가중치로 혼합한다.
export const RUNNER_ANIM = {
  idle: 'AnimalArmature|Idle',
  walk: 'AnimalArmature|Walk',
  flight: 'AnimalArmature|Gallop_Jump',
  run: 'AnimalArmature|Gallop',
} as const;

// 천마 룩: 모델 머티리얼 이름별 색 덮어쓰기(원본 glb는 그대로).
export const UNICORN_TINT: Record<string, string> = {
  Main: '#f0ebe2',
  Main_Light: '#e8dfce',
  Hair: '#d9dfdf',
  Muzzle: '#aaa4a1',
  Hooves: '#4c4841',
  Eye_Black: '#211e1b',
  Eye_White: '#c9bfae',
};

// 뿔: Head 뼈에 붙인다. 뼈에 스케일 100이 들어 있어 자식은 boneScaleFix로 보정.
// 위치·회전은 Head 로컬(+Z = 위·앞, +Y = 코 방향) 기준 모델 단위. 실측: 뼈 원점(0,4.18,2.53) → 이마 위(0,4.6,2.9).
export const HORN = {
  boneScaleFix: 0.01,
  position: [0, 0.18, 0.4] as [number, number, number],
  tiltForward: 0.18,
  radius: 0.085,
  height: 0.86,
  bend: 0.07,
  color: '#e4c17f',
  ridgeColor: '#fff0c7',
} as const;

export const WINGS = {
  root: [0.42, 0.5, -0.35] as [number, number, number],
  span: 4.4,
  feathers: 26,
  foldedAngle: -0.12,
  foldedScale: 0.65,
  openAngleBase: 0.45,
  flapAmplitude: 0.65,
  flapSpeedAir: 3.2,
  flapSpeedRising: 5.5,
  color: '#eee9df',
} as const;

// 달리기 모션 튜닝값.
export const RUNNER_ANIM_TUNING = {
  // 달리기 클립이 자연스러운 기준 속도(m/s). 실제 속도 ÷ 이 값 = 재생 배속.
  runRefSpeed: 8.5,
  // 재생 배속 하한·상한(너무 느리거나 빠르지 않게).
  minRunScale: 0.6,
  maxRunScale: 2.2,
  // 프레임 시간에 독립적인 포즈 전환과 걷기↔갤럽 구간.
  blendRate: 9,
  walkRefSpeed: 2.6,
  gallopBlendStart: 4,
  gallopBlendEnd: 7,
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
  sizeMin: 0.025,
  sizeMax: 0.07,
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

// 접지 그림자: 정규화한 말 크기에 맞춘 타원. 지면보다 hover만큼 띄워 z-fight를 피하고, fadeHeight 고도에서 완전히 사라진다.
export const GROUND_SHADOW = {
  width: 1.6,
  length: 3.2,
  core: 0.3,
  opacity: 0.32,
  hover: 0.04,
  fadeHeight: 8,
  airSpread: 0.6,
  // 투명 패스에서 물 다음에 그린다 — 하상 위 그림자가 물을 통해 비친다.
  renderOrder: 1,
} as const;
