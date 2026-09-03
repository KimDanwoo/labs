import { BufferGeometry, Float32BufferAttribute } from 'three';

// 카메라 주변 청크만 유지(chunk-follow). 멀어진 청크는 언마운트 → 메모리·초기화 절약.
export const GRASS_FIELD = {
  tile: 16,
  minScale: 1.9,
  maxScale: 3.3,
} as const;

// 거리별 LOD 링. ring = 카메라 셀에서의 체비쇼프 거리. 링은 blade "풀" 크기와 분할 수만 정한다 —
// 실제로 보이는 밀도·크기는 셰이더가 카메라 거리로 연속 계산한다(GRASS_LOD). 그래서 링 경계에서 팝이 없다.
// 원본 glb blade는 144삼각형이라 12만 개면 프레임당 1,700만 삼각형이었다.
export type GrassLodRing = { maxRing: number; blades: number; segments: number };

// 연속 LOD: keep(d) = exp(-(d - nearFull) / falloff) → 거리 d에서 살리는 blade 비율(첫 링 풀 기준).
// 각 blade는 인덱스 비율 aLodIndex = i / 첫 링 풀을 갖고, aLodIndex ≤ keep이면 보인다. 풀이 바뀌어도 보이는 집합이 같아 링 경계 팝이 없고,
// 임계 근처(keep×growBand~keep)는 크기를 줄여 다가갈수록 자라나듯 나타난다. 살아남는 blade는 farScale까지 커진다.
export const GRASS_LOD = {
  nearFull: 20,
  falloff: 50,
  growBand: 0.85,
  farScale: 2,
  scaleNear: 20,
  scaleFar: 100,
} as const;

export function grassKeepAt(distance: number): number {
  return Math.exp(-Math.max(distance - GRASS_LOD.nearFull, 0) / GRASS_LOD.falloff);
}

// 진짜 blade는 마지막 링까지만. 그 너머는 Ground 셰이더의 잔디 무늬가 인상을 이어가고 안개가 닫는다.
// 불변식 1: fadeFar < (마지막 maxRing + 0.5) * tile → blade가 청크 끝보다 먼저 지면색에 녹아 경계가 없다(데스크톱 66 < 72, 모바일 34 < 40).
// 불변식 2: 각 링 풀 ≥ 첫 링 풀 × keep(링 안쪽 경계 거리) → 링 경계에서 blade가 튀지 않는다(테스트로 고정).
export const GRASS_QUALITY = {
  desktop: {
    rings: [
      { maxRing: 2, blades: 2200, segments: 5 },
      { maxRing: 4, blades: 1500, segments: 2 },
    ] as GrassLodRing[],
    fadeNear: 28,
    fadeFar: 66,
  },
  mobile: {
    rings: [
      { maxRing: 1, blades: 1000, segments: 3 },
      { maxRing: 2, blades: 950, segments: 1 },
    ] as GrassLodRing[],
    fadeNear: 10,
    fadeFar: 34,
  },
} as const;

export type GrassQuality = keyof typeof GRASS_QUALITY;

export function grassViewRadius(quality: GrassQuality): number {
  const rings = GRASS_QUALITY[quality].rings;
  return rings[rings.length - 1]!.maxRing;
}

export function grassLodForRing(quality: GrassQuality, ring: number): GrassLodRing {
  const rings = GRASS_QUALITY[quality].rings;
  return rings.find((lod) => ring <= lod.maxRing) ?? rings[rings.length - 1]!;
}

// 절차적 blade: 밑동 폭 → 끝 0으로 좁아지는 띠를 segments개로 나누고, 위로 갈수록 -z로 굽힌다(원본 glb 실루엣과 비슷).
// uv.y 0(밑동)→1(끝)은 셰이더의 바람·색 그라데이션이 쓴다. 노멀 없음(unlit).
export function makeBladeGeometry(segments: number): BufferGeometry {
  // 폭은 밑동에서 선형으로 좁아지고 끝은 한 번 더 조여 뾰족하게. 넓게 두면 잎사귀처럼 보인다.
  const BASE_HALF_WIDTH = 0.055;
  const HEIGHT = 0.83;
  const BEND = 0.18;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const halfWidth = BASE_HALF_WIDTH * (1 - t) * (1 - 0.35 * t);
    const y = HEIGHT * t;
    const z = -BEND * t * t;
    positions.push(-halfWidth, y, z, halfWidth, y, z);
    uvs.push(0, t, 1, t);
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

// 셀 좌표 → 결정적 시드(재방문해도 같은 배치).
export function chunkSeed(cellX: number, cellZ: number): number {
  return (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663)) >>> 0;
}

// 질주 발동 시 말에서 퍼져나가는 돌풍 파동 — 반경 speed·age의 고리(폭 width)가 잔디를 바깥으로 눕히며 duration 동안 잦아든다.
export const GUST = {
  speed: 40,
  width: 5,
  duration: 1.2,
  bend: 3,
} as const;

// 말 주변 잔디가 말을 피해 눕는 반경과 세기.
const RUNNER_PUSH = { radius: 2.6, bend: 2.2 } as const;

// 바람: 끝(uv.y=1)일수록 더 흔들리고, 완만한 돌풍(gust)으로 세기가 출렁인다.
// blade별 위치 해시로 색·바람 위상을 흩어 군집감을 준다.
// 말 위치·질주 돌풍 유니폼으로 잔디가 말에 반응한다(끝일수록 많이 밀림 = dispPower).
export const GRASS_VERTEX_SHADER = `
  attribute float aLodIndex;
  uniform float uTime;
  uniform vec2 uRunnerXZ;
  uniform float uRunnerAir;
  uniform vec2 uGustOrigin;
  uniform float uGustAge;
  varying float vFrc;
  varying float vDist;
  varying float vTint;
  varying vec2 vWorldXZ;
  void main() {
    // 연속 LOD: blade 밑동의 카메라 XZ 거리로 살릴지·얼마나 키울지 정한다. 인덱스 비율(aLodIndex)이 keep 아래면 보이고,
    // 임계 근처는 크기를 줄여 다가갈수록 자라난다. 죽은 blade는 크기 0.
    vec2 basePos = instanceMatrix[3].xz;
    float camDist = distance(basePos, cameraPosition.xz);
    float keep = exp(-max(camDist - ${GRASS_LOD.nearFull.toFixed(1)}, 0.0) / ${GRASS_LOD.falloff.toFixed(1)});
    float alive = 1.0 - smoothstep(keep * ${GRASS_LOD.growBand.toFixed(2)}, keep, aLodIndex);
    float lodScale = mix(1.0, ${GRASS_LOD.farScale.toFixed(2)}, smoothstep(${GRASS_LOD.scaleNear.toFixed(1)}, ${GRASS_LOD.scaleFar.toFixed(1)}, camDist));
    vec4 world = instanceMatrix * vec4(position * lodScale * alive, 1.0);
    vWorldXZ = world.xz;
    float hash = fract(sin(dot(floor(world.xz), vec2(12.9898, 78.233))) * 43758.5453);
    vTint = 0.86 + hash * 0.28;

    float dispPower = (1.0 - cos(uv.y * 1.5708)) * 0.35;
    float gust = sin(uTime * 0.6 + world.x * 0.05 + world.z * 0.05) * 0.5 + 0.5;
    float windAmt = 0.12 * dispPower * (0.7 + 0.7 * gust);
    float disp = sin(world.z * 0.6 + uTime * 2.2 + hash * 6.28) * windAmt
               + cos(world.x * 0.5 + uTime * 1.6) * windAmt * 0.5;
    world.x += disp;
    world.z += disp * 0.5;

    vec2 away = world.xz - uRunnerXZ;
    float awayDist = max(length(away), 0.001);
    float grounded = 1.0 - smoothstep(0.5, 3.0, uRunnerAir);
    float push = smoothstep(${RUNNER_PUSH.radius.toFixed(2)}, 0.4, awayDist) * dispPower * ${RUNNER_PUSH.bend.toFixed(2)} * grounded;
    world.xz += (away / awayDist) * push;

    vec2 fromGust = world.xz - uGustOrigin;
    float gustDist = max(length(fromGust), 0.001);
    float ringRadius = uGustAge * ${GUST.speed.toFixed(2)};
    float ring = exp(-pow((gustDist - ringRadius) / ${GUST.width.toFixed(2)}, 2.0))
               * step(0.0, uGustAge) * (1.0 - smoothstep(0.0, ${GUST.duration.toFixed(2)}, uGustAge));
    world.xz += (fromGust / gustDist) * ring * dispPower * ${GUST.bend.toFixed(2)};

    vFrc = uv.y;
    // 씬 fog와 같은 뷰 공간 깊이. XZ 거리로 하면 위에서 내려다볼 때 지면 fog와 어긋난다.
    vDist = -(viewMatrix * world).z;
    gl_Position = projectionMatrix * modelViewMatrix * world;
  }
`;

// 밑동 진초록 → 끝 싱그러운 생초록 + blade별 색 변주. 거리에 따라 "그 자리 지면색(안개 적용)"으로 페이드해
// blade가 끝나는 곳이 보이지 않는다 — 안개색으로 직접 페이드하면 아직 안개가 덜 낀 지면과 어긋나 띠가 생긴다.
export const GRASS_FRAGMENT_SHADER = `
  uniform float uBrightness;
  uniform vec3 uHorizonColor;
  uniform vec3 uGroundColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying float vFrc;
  varying float vDist;
  varying float vTint;
  varying vec2 vWorldXZ;
  void main() {
    vec3 baseColor = vec3(0.09, 0.36, 0.14);
    vec3 tipColor = vec3(0.42, 0.78, 0.30);
    vec3 col = mix(baseColor, tipColor, vFrc) * uBrightness * vTint;

    // 광역 색 얼룩(초원의 옅고 진한 패치)
    float meadow = sin(vWorldXZ.x * 0.045) * sin(vWorldXZ.y * 0.045) * 0.5 + 0.5;
    col *= mix(0.9, 1.08, meadow);

    vec3 groundHere = mix(uGroundColor, uHorizonColor, smoothstep(uFogNear, uFogFar, vDist));
    float fade = smoothstep(uFadeNear, uFadeFar, vDist);
    col = mix(col, groundHere, fade);
    gl_FragColor = vec4(col, 1.0);
  }
`;
