import { MEADOW_PATH, OCEAN, RIVER, RIVER_TRENCH_HALF_WIDTH, TERRAIN } from '../../config/scene';

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

function coastBedDepthAt(x: number, z: number): number {
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

export type RiverBearing = 'ahead' | 'behind' | 'left' | 'right' | 'crossing';
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

export function meadowPathX(z: number): number {
  return -MEADOW_PATH.drift * Math.sin((Math.max(0, z) / MEADOW_PATH.length) * Math.PI) ** 2;
}

export function meadowPathDistanceAt(x: number, z: number): number {
  if (z < -25 || z > MEADOW_PATH.length + 25) return Infinity;
  return Math.abs(x - meadowPathX(z));
}

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
