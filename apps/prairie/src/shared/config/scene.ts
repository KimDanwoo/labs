// WebGL 머티리얼 색은 토큰으로 표현 불가 → 파스텔 톤 팔레트를 여기 한곳에 모은다.
export const SCENE_COLORS = {
  skyTop: '#74abc6',
  skyBottom: '#f5dfbb',
  // 먼 들판이 대기에 희미해진 색. 잔디 페이드·물·자갈의 원경색이 전부 이 값을 쓴다.
  // 하늘과의 이음은 Haze가 맡으므로 큐브맵 지평선색에 맞출 필요가 없다 — 하늘색이면 잔디 너머가 '하늘 띠'로 읽힌다.
  fog: '#c9d2b7',
  sunLight: '#ffe3b0',
  ambient: '#afcddd',
  // unlit 지면색 = 잔디 blade가 멀어지며 녹아드는 색. 하상 강둑 블렌드도 이 값.
  grass: '#607c49',
  grassBase: '#304b36',
  grassTip: '#9eb96e',
  grassDry: '#d3be87',
  oceanHorizon: '#c5d4ce',
  waterDeep: '#376d70',
  waterShallow: '#8fae94',
  pebbleDark: '#8b8873',
  pebbleLight: '#b8ad91',
} as const;

export const WORLD = {
  groundSize: 1400,
  // fog 깊이는 정점에서 계산돼 삼각형 안에서 선형 보간된다. 1400m 평면이 삼각형 2개면 원경이 덜 안개 낀 채
  // 대각선 경계가 보이므로(특히 공중에서) 충분히 분할한다.
  groundSegments: 100,
} as const;

// 완만한 굽이와 폭 변화를 공유하는 강. 반복 간격은 굽이·강둑까지 안개 밖에서 전환되도록 확보한다.
export const RIVER = {
  firstX: 110,
  period: 1600,
  bends: [
    { amplitude: 20, frequency: 0.008 },
    { amplitude: 8, frequency: 0.021 },
  ],
  widthWaves: [
    { amplitude: 0.12, frequency: 0.013 },
    { amplitude: 0.06, frequency: 0.031 },
  ],
  // 수면 명목 반폭. HUD의 물속 판정·잔디 기준이며, 하상 프로파일이 이 지점에서 수면과 만나도록 아래 값을 맞춘다(테스트로 고정).
  halfWidth: 36,
  // 수면 밖 강둑(자갈) 폭. 골 전체 반폭 = halfWidth + bankWidth.
  bankWidth: 7,
  // Z 길이는 안개 시야를 앞뒤로 덮는다. 모바일 메시는 River에서 더 짧게 만든다.
  length: 800,
  // 명목 단면: 중앙은 depth만큼 파이고, slopeStart부터 강둑까지 완만하게 올라온다.
  depth: 2.2,
  slopeStart: 15.5,
  // 수면은 지면보다 이만큼 낮다 → 강둑이 수면 위로 드러난다.
  waterDrop: 0.35,
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

export const OCEAN = {
  coastZ: 900,
  beachWidth: 24,
  shelfLength: 150,
  depth: 6,
  estuaryStart: 500,
  estuaryEnd: 900,
  estuaryExpansion: 2.2,
} as const;

export const RIVER_TRENCH_HALF_WIDTH = RIVER.halfWidth + RIVER.bankWidth;

// CPU placement, collision and GPU river geometry share these wave parameters.
export function riverOffsetAt(z: number): number {
  return RIVER.bends.reduce((offset, wave) => offset + wave.amplitude * Math.sin(z * wave.frequency), 0);
}

export function riverWidthAt(z: number): number {
  const variation =
    1 + RIVER.widthWaves.reduce((width, wave) => width + wave.amplitude * Math.sin(z * wave.frequency), 0);
  return variation * (1 + OCEAN.estuaryExpansion * smoothstep(OCEAN.estuaryStart, OCEAN.estuaryEnd, z));
}

export function nearestRiverX(x: number, z = 0): number {
  const origin = RIVER.firstX + riverOffsetAt(z);
  return origin + Math.round((x - origin) / RIVER.period) * RIVER.period;
}

// Distance in the nominal cross-section; dividing by width keeps water, banks,
// vegetation and collision on the same profile as the channel widens/narrows.
export function distanceToRiver(x: number, z = 0): number {
  return Math.abs(x - nearestRiverX(x, z)) / riverWidthAt(z);
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

// Positive offshore, negative inland. A broad coast remains stable as the camera moves.
export function coastDistanceAt(x: number, z: number): number {
  return z - (OCEAN.coastZ + 18 * Math.sin(x * 0.004) + 9 * Math.sin(x * 0.011));
}

export function coastBedDepthAt(x: number, z: number): number {
  const coast = coastDistanceAt(x, z);
  return (
    RIVER.waterDrop * smoothstep(-OCEAN.beachWidth, 0, coast) + OCEAN.depth * smoothstep(0, OCEAN.shelfLength, coast)
  );
}

export function waterBedDepthAt(x: number, z: number): number {
  return Math.max(riverBedDepthAt(distanceToRiver(x, z)), coastBedDepthAt(x, z));
}

export function groundHeightAt(x: number, z: number): number {
  return terrainHeightAt(x, z) - waterBedDepthAt(x, z);
}

export function waterDepthAt(x: number, z: number): number {
  return Math.max(0, waterBedDepthAt(x, z) - RIVER.waterDrop);
}

export const RIVER_BEARINGS = ['ahead', 'behind', 'left', 'right', 'crossing'] as const;
export type RiverBearing = (typeof RIVER_BEARINGS)[number];

// 화면 기준으로 강이 어느 쪽인지. 카메라가 말 뒤에서 +Z를 보는 배치라 화면 오른쪽 축은 world -X → -cos(yaw).
// 현재 Z 단면의 물가 방향을 안내한다.
export function riverBearing(x: number, camYaw: number, z = 0): RiverBearing {
  if (distanceToRiver(x, z) < RIVER.halfWidth) return 'crossing';
  const toRiver = Math.sign(nearestRiverX(x, z) - x);
  const ahead = toRiver * Math.sin(camYaw);
  const right = toRiver * -Math.cos(camYaw);
  if (Math.abs(ahead) > Math.abs(right)) return ahead > 0 ? 'ahead' : 'behind';
  return right > 0 ? 'right' : 'left';
}

export const SUN = {
  position: [-65, 65, -35] as [number, number, number],
  intensity: 2.6,
  ambientIntensity: 0.65,
};

// 기기별 안개. 잔디 blade는 fadeFar에서 지면색에 완전히 녹으므로(데스크톱 66 < 청크 끝 72) 안개가 청크 끝을 가릴 필요는 없다 —
// 안개는 그 너머 평지를 능선 밑동에 닿기 전에 닫는 역할. 강 불변식: RIVER.period/2 > far, RIVER.length > 2×far.
export const FOG = {
  desktop: { near: 85, far: 360 },
  mobile: { near: 36, far: 140 },
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
  topY: 340,
  fadeStartY: 0,
  fadeTopY: 70,
} as const;

// 능선 겹. 먼 겹부터 그린다 — 멀수록 높고 하늘색에 가깝게 바래고(대기 원근), 가까울수록 낮고 짙다.
// baseY/ampY는 월드 m(원통 반경 1000 기준). cells는 원통 한 바퀴의 노이즈 셀 수(정수 → 이음새 없음).
export const RIDGES = [
  { baseY: 30, ampY: 180, cells: 9, seed: 0.17, color: '#a6b5bf' },
  { baseY: 18, ampY: 115, cells: 17, seed: 0.53, color: '#81989d' },
  { baseY: 10, ampY: 65, cells: 29, seed: 0.81, color: '#607e79' },
] as const;

export const CAMERA = {
  fov: 55,
  near: 0.1,
  far: 1200,
  // 말 뒤를 낮게 따라가는 고정 추적 카메라.
  followDistance: 9.5,
  followHeight: 3.6,
  // 카메라 자리의 지형 위로 최소 이만큼 띄운다(언덕 뒤에서 땅에 묻히지 않게).
  groundClearance: 2.4,
  // 카메라가 바라보는 지점의 높이(말 몸통) → 말이 화면 중앙에 온다.
  targetHeight: 1.35,
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
    distanceToRiver(x, z),
  );
  if (mask === 0) return 0;
  let h = 0;
  for (const wave of TERRAIN.waves) h += wave.amp * Math.sin(x * wave.kx + z * wave.kz + wave.phase);
  return mask * h * (1 - smoothstep(-OCEAN.beachWidth - 70, -OCEAN.beachWidth, coastDistanceAt(x, z)));
}
