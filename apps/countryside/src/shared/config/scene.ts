// WebGL 머티리얼 색은 토큰으로 표현 불가 → 지브리풍 파스텔 팔레트를 여기 한곳에 모은다.
export const SCENE_COLORS = {
  skyTop: '#8ec9ee',
  skyBottom: '#e6f3fb',
  fog: '#87bbc8', // 큐브맵 지평선 라인 하늘색과 일치(정밀 샘플) → 먼 잔디가 하늘색이 됨
  sunLight: '#fff3da',
  ambient: '#dbe8f3',
  grass: '#3f8a36',
  grassDark: '#2f6628',
  dirt: '#caa37c',
  dirtEdge: '#b1885f',
} as const;

export const WORLD = {
  groundSize: 900,
} as const;

// 뒤로 갈수록 푸르스름·흐릿하게(안개와 함께 원근감). 각 레이어는 360° 링으로 배치한다.
export const MOUNTAIN_LAYERS = [
  { color: '#9bb9a2', radius: 250, height: 46, width: 86, count: 16 },
  { color: '#87a591', radius: 312, height: 66, width: 118, count: 14 },
  { color: '#74917f', radius: 374, height: 88, width: 150, count: 12 },
] as const;

export const HILLS = {
  color: '#79b566',
  radius: 150,
  count: 9,
} as const;

export const CLOUDS = {
  count: 18,
  size: 130,
  areaXZ: 360,
  minY: 88,
  maxY: 150,
} as const;

export const SUN = {
  position: [70, 85, 35] as [number, number, number],
  intensity: 1.35,
  ambientIntensity: 0.95,
  hemisphereIntensity: 0.6,
  shadowMapSize: 1536,
  shadowExtent: 110,
};

export const FOG = {
  near: 34,
  far: 92,
} as const;

export const SKY = {
  radius: 500,
} as const;

export const CAMERA = {
  fov: 64,
  near: 0.1,
  far: 1200,
  // 말 뒤를 낮게 따라가는 고정 추적 카메라.
  followDistance: 15,
  followHeight: 3.8,
  // 카메라가 바라보는 지점의 높이(말 몸통) → 말이 화면 중앙에 온다.
  targetHeight: 1.6,
  positionLerp: 0.1,
  targetLerp: 0.14,
} as const;
