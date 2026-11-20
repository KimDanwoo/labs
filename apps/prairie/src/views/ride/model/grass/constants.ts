export const GRASS_FIELD = {
  tile: 16,
  minScale: 0.45,
  maxScale: 1.05,
  minLean: 0.08,
  maxLean: 0.38,
} as const;

type GrassLodRing = { maxRing: number; blades: number; segments: number };

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

export function chunkSeed(cellX: number, cellZ: number): number {
  return (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663)) >>> 0;
}

export const GUST = {
  speed: 40,
  width: 5,
  duration: 1.2,
  bend: 3,
} as const;
