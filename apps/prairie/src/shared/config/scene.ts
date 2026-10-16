// WebGL 머티리얼 색은 토큰으로 표현 불가 → 파스텔 톤 팔레트를 여기 한곳에 모은다.
export const SCENE_COLORS = {
  skyTop: '#8ec9ee',
  skyBottom: '#e6f3fb',
  // 먼 들판이 대기에 희미해진 색. 잔디 페이드·물·자갈의 원경색이 전부 이 값을 쓴다.
  // 하늘과의 이음은 Haze가 맡으므로 큐브맵 지평선색에 맞출 필요가 없다 — 하늘색이면 잔디 너머가 '하늘 띠'로 읽힌다.
  fog: '#bac8ac',
  sunLight: '#fff3da',
  ambient: '#dbe8f3',
  // unlit 지면색 = 잔디 blade가 멀어지며 녹아드는 색. 하상 강둑 블렌드도 이 값.
  grass: '#788754',
  grassBase: '#354f32',
  grassTip: '#afbd78',
  waterDeep: '#5c9db5',
  waterShallow: '#a6cfd8',
  pebbleDark: '#8a7f72',
  pebbleLight: '#d9cdb9',
} as const;

export const WORLD = {
  groundSize: 900,
  // fog 깊이는 정점에서 계산돼 삼각형 안에서 선형 보간된다. 900m 평면이 삼각형 2개면 원경이 덜 안개 낀 채
  // 대각선 경계가 보이므로(특히 공중에서) 충분히 분할한다.
  groundSegments: 64,
} as const;

// 강은 Z축으로 무한한 띠. X로 period마다 반복 → 좌우 어느 쪽으로 달려도 만난다(정면 +Z는 순수 초원).
// 불변식 period/2 > FOG.far → 화면에 강이 둘 이상 들어오지 않는다(220 > 200) → 평면 한 장으로 충분.
export const RIVER = {
  firstX: 110,
  period: 440,
  // 수면 명목 반폭. HUD의 물속 판정·잔디 기준이며, 하상 프로파일이 이 지점에서 수면과 만나도록 아래 값을 맞춘다(테스트로 고정).
  halfWidth: 16,
  // 수면 밖 강둑(자갈) 폭. 골 전체 반폭 = halfWidth + bankWidth.
  bankWidth: 3.2,
  // Z 길이는 안개 시야(FOG.far)를 앞뒤로 덮으면 된다(2×200 < 440).
  length: 440,
  // 하상 프로파일: 중앙은 지면 아래 depth까지 파이고, slopeStart부터 골 가장자리까지 완만하게 올라온다.
  depth: 1.8,
  slopeStart: 6.8,
  // 수면은 지면보다 이만큼 낮다 → 강둑이 수면 위로 드러난다.
  waterDrop: 0.3,
  rippleHeight: 0.05,
  // 물속 최고속도 배율. 수심이 wadeDepthRef 이상이면 최대 감속.
  wadeSpeedScale: 0.5,
  wadeDepthRef: 0.8,
  // 골 가장자리 바깥으로 잔디가 성겨지고 낮아지는 폭(범람원). 카메라(말 뒤 15m)가 강을 내려다볼 때 앞 잔디가 가리지 않게 넉넉히.
  grassFade: 14,
  grassMinHeight: 0.4,
  // 잔디가 골 가장자리 안쪽(강둑 경사 윗부분)까지 넘어오는 폭 — Ground 구멍 테두리 이음새를 덮는다.
  grassOverhang: 2.5,
} as const;

export const RIVER_TRENCH_HALF_WIDTH = RIVER.halfWidth + RIVER.bankWidth;

// firstX 격자에서 가장 가까운 강의 중심 X.
export function nearestRiverX(x: number): number {
  return RIVER.firstX + Math.round((x - RIVER.firstX) / RIVER.period) * RIVER.period;
}

// 강 중심선까지의 거리. halfWidth 미만이면 물속.
export function distanceToRiver(x: number): number {
  return Math.abs(x - nearestRiverX(x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// 강 중심에서 dist만큼 떨어진 곳의 하상 깊이(지면 기준, 양수 = 아래). RIVER_GLSL의 riverBedDepth와 같은 식.
export function riverBedDepthAt(dist: number): number {
  return RIVER.depth * (1 - smoothstep(RIVER.slopeStart, RIVER_TRENCH_HALF_WIDTH, dist));
}

// 그 지점의 수심(수면 아래 하상까지). 0이면 물 밖.
export function riverWaterDepthAt(dist: number): number {
  return Math.max(0, riverBedDepthAt(dist) - RIVER.waterDrop);
}

export const RIVER_BEARINGS = ['ahead', 'behind', 'left', 'right', 'crossing'] as const;
export type RiverBearing = (typeof RIVER_BEARINGS)[number];

// 화면 기준으로 강이 어느 쪽인지. 카메라가 말 뒤에서 +Z를 보는 배치라 화면 오른쪽 축은 world -X → -cos(yaw).
// 강은 Z로 무한하니 최단 경로는 언제나 X축 횡단 한 방향뿐이다.
export function riverBearing(x: number, camYaw: number): RiverBearing {
  if (distanceToRiver(x) < RIVER.halfWidth) return 'crossing';
  const toRiver = Math.sign(nearestRiverX(x) - x);
  const ahead = toRiver * Math.sin(camYaw);
  const right = toRiver * -Math.cos(camYaw);
  if (Math.abs(ahead) > Math.abs(right)) return ahead > 0 ? 'ahead' : 'behind';
  return right > 0 ? 'right' : 'left';
}

export const SUN = {
  position: [70, 85, 35] as [number, number, number],
  intensity: 1.35,
  ambientIntensity: 0.95,
};

// 기기별 안개. 잔디 blade는 fadeFar에서 지면색에 완전히 녹으므로(데스크톱 66 < 청크 끝 72) 안개가 청크 끝을 가릴 필요는 없다 —
// 안개는 그 너머 평지를 능선 밑동에 닿기 전에 닫는 역할. 강 불변식: RIVER.period/2 > far, RIVER.length > 2×far.
export const FOG = {
  desktop: { near: 50, far: 200 },
  mobile: { near: 24, far: 90 },
} as const;

export type FogQuality = keyof typeof FOG;

// 지평선 헤이즈: 카메라를 따라다니는 원통. 지평선 아래는 안개색으로 덮고 위로 fadeTopY까지 투명해져
// 단색 안개 바닥과 그라데이션 큐브맵 하늘 사이의 선을 녹인다. radius < CAMERA.far.
// 같은 원통에 먼 능선 실루엣을 그린다(절차 노이즈, topY까지). 원통이 카메라를 따라다니되 회전은 안 하므로
// 능선은 월드 방위에 고정되고 시차가 0 → 수 km 밖 산으로 읽힌다.
export const HAZE = {
  radius: 1000,
  bottomY: -80,
  // 가장 높은 능선(baseY + ampY)보다 높아야 봉우리가 잘리지 않는다(테스트로 고정).
  topY: 200,
  fadeStartY: 0,
  fadeTopY: 70,
} as const;

// 능선 겹. 먼 겹부터 그린다 — 멀수록 높고 하늘색에 가깝게 바래고(대기 원근), 가까울수록 낮고 짙다.
// baseY/ampY는 월드 m(원통 반경 1000 기준). cells는 원통 한 바퀴의 노이즈 셀 수(정수 → 이음새 없음).
export const RIDGES = [
  { baseY: 30, ampY: 150, cells: 4, seed: 0.17, color: '#9aafb0' },
  { baseY: 18, ampY: 95, cells: 7, seed: 0.53, color: '#819b8b' },
  { baseY: 10, ampY: 70, cells: 12, seed: 0.81, color: '#667f63' },
] as const;

export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 1200,
  // 말 뒤를 낮게 따라가는 고정 추적 카메라.
  followDistance: 19,
  followHeight: 5,
  // 카메라 자리의 지형 위로 최소 이만큼 띄운다(언덕 뒤에서 땅에 묻히지 않게).
  groundClearance: 2.4,
  // 카메라가 바라보는 지점의 높이(말 몸통) → 말이 화면 중앙에 온다.
  targetHeight: 1.6,
  positionLerp: 0.1,
  targetLerp: 0.14,
} as const;

// 완만한 지형 기복. 사인 세 겹의 합이라 JS와 GLSL이 같은 식을 쓴다(상수를 GLSL로 굽는다).
// 강 골 주변(maskNear~maskFar)은 0으로 눌러 강·하상·물의 평지 전제를 지킨다. 최대 경사 ≈ Σ amp·k ≈ 0.2(11°).
export const TERRAIN = {
  waves: [
    { amp: 4, kx: 0.021, kz: 0.013, phase: 0 },
    { amp: 2.5, kx: -0.011, kz: 0.027, phase: 1.7 },
    { amp: 1.2, kx: 0.047, kz: -0.031, phase: 0.6 },
  ],
  maskNear: 25,
  maskFar: 70,
} as const;

export function terrainHeightAt(x: number, z: number): number {
  const mask = smoothstep(
    RIVER_TRENCH_HALF_WIDTH + TERRAIN.maskNear,
    RIVER_TRENCH_HALF_WIDTH + TERRAIN.maskFar,
    distanceToRiver(x),
  );
  if (mask === 0) return 0;
  let h = 0;
  for (const wave of TERRAIN.waves) h += wave.amp * Math.sin(x * wave.kx + z * wave.kz + wave.phase);
  return mask * h;
}
