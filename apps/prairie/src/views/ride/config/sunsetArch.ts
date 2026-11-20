export const SUNSET_ARCH = {
  pillarSides: [-1, 1],
  pillarBlocks: 4,
  keystones: 11,
  floatingRocks: 7,
  particles: 64,
  burstSeconds: 3,
  burstIdle: -100 as number,
  stoneSegments: { low: 1, high: 2 },
  stoneRadius: 0.08,
  surface: { roughness: 0.9, bumpScale: 0.1, rockBumpScale: 0.08 },
  glyph: { position: [0, 9, -1.8], args: [7, 0.055, 4, 48, Math.PI], idleOpacity: 0.15 },
  particleGeometry: [1, 0],
} as const;
