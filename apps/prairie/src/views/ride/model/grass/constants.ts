// 카메라 주변 청크만 유지(chunk-follow). 멀어진 청크는 언마운트 → 메모리·초기화 절약.
export const GRASS_FIELD = {
  tile: 16,
  minScale: 0.45,
  maxScale: 1.05,
  // blade 기울기(rad). 위에서 내려다볼 때도 면이 보이도록 수직에서 살짝 눕힌다.
  minLean: 0.08,
  maxLean: 0.38,
} as const;

// 거리별 LOD 링. ring = 카메라 셀에서의 체비쇼프 거리. 링은 blade "풀" 크기와 분할 수만 정한다 —
// 실제로 보이는 밀도·크기는 셰이더가 카메라 거리로 연속 계산한다(GRASS_LOD). 그래서 링 경계에서 팝이 없다.
// 원본 glb blade는 144삼각형이라 12만 개면 프레임당 1,700만 삼각형이었다.
type GrassLodRing = { maxRing: number; blades: number; segments: number };

// 연속 LOD: keep(d) = exp(-(d - nearFull) / falloff) → 거리 d에서 살리는 blade 비율(첫 링 풀 기준).
// 각 blade는 인덱스 비율 aLodIndex = i / 첫 링 풀을 갖고, aLodIndex ≤ keep이면 보인다. 풀이 바뀌어도 보이는 집합이 같아 링 경계 팝이 없고,
// 임계 근처(keep×growBand~keep)는 크기를 줄여 다가갈수록 자라나듯 나타난다. 살아남는 blade는 farScale까지 커진다.
export const GRASS_LOD = {
  nearFull: 16,
  falloff: 30,
  growBand: 0.85,
  farScale: 2,
  scaleNear: 20,
  scaleFar: 100,
} as const;

export function grassKeepAt(distance: number): number {
  return Math.exp(-Math.max(distance - GRASS_LOD.nearFull, 0) / GRASS_LOD.falloff);
}

// 진짜 blade는 마지막 링까지만. 그 너머는 Ground 셰이더의 잔디 무늬가 인상을 이어가고 안개가 닫는다.
// 불변식 1: fadeFar < (마지막 maxRing + 0.5) * tile → blade가 청크 끝보다 먼저 지면색에 녹아 경계가 없다(데스크톱 130 < 136, 모바일 66 < 72).
// 불변식 2: 각 링 풀 ≥ 첫 링 풀 × keep(링 안쪽 경계 거리) → 링 경계에서 blade가 튀지 않는다(테스트로 고정).
// 데스크톱 바깥 링(5~8)은 1분할 blade(삼각형 2개) — 공중에서 내려다볼 때 원반 끝이 안개 안쪽에서 드러나지 않게 136m까지 민다.
export const GRASS_QUALITY = {
  desktop: {
    rings: [
      { maxRing: 2, blades: 2300, segments: 3 },
      { maxRing: 4, blades: 1200, segments: 2 },
      { maxRing: 8, blades: 500, segments: 1 },
    ] as GrassLodRing[],
    fadeNear: 60,
    fadeFar: 130,
  },
  mobile: {
    rings: [
      { maxRing: 1, blades: 1100, segments: 2 },
      { maxRing: 2, blades: 900, segments: 1 },
      { maxRing: 4, blades: 800, segments: 1 },
    ] as GrassLodRing[],
    fadeNear: 20,
    fadeFar: 66,
  },
  // SwiftShader·llvmpipe는 정점을 CPU로 처리해 모바일 단계(약 7만 blade)에서도 프레임당 0.5초가 걸린다.
  // 가까운 두 링만 1분할로 남기고(약 1만 blade) 나머지는 Ground 잔디 무늬와 안개에 맡긴다(40 > 38).
  software: {
    rings: [
      { maxRing: 1, blades: 500, segments: 1 },
      { maxRing: 2, blades: 400, segments: 1 },
    ] as GrassLodRing[],
    fadeNear: 16,
    fadeFar: 38,
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
