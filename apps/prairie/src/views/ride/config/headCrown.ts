type Vec3 = readonly [number, number, number];

export const HEAD_CROWN = {
  scale: 0.01,
  brow: {
    points: [
      [-0.28, 0.25, 0.25],
      [-0.17, 0.3, 0.35],
      [0, 0.35, 0.39],
      [0.17, 0.3, 0.35],
      [0.28, 0.25, 0.25],
    ] as readonly Vec3[],
    tubularSegments: 32,
    radius: 0.012,
    radialSegments: 6,
    material: { metalness: 0.85, roughness: 0.24 },
  },
  gem: {
    position: [0, 0.36, 0.4] as Vec3,
    scale: [0.075, 0.1, 0.045] as Vec3,
    detail: [1, 1] as const,
    material: { metalness: 0.2, roughness: 0.12, clearcoat: 1, iridescence: 0.45 },
  },
  locks: {
    count: 7,
    spreadSteps: 3,
    sideOffsets: [
      [0.04, -0.12, 0.48],
      [0.13, 0.08, 0.6],
      [0.16, 0.36, 0.38],
      [0.14, 0.55, 0.22],
    ] as readonly Vec3[],
    tipRise: 0.1,
    tubularSegments: 24,
    radius: 0.018,
    radiusTaper: 0.006,
    radialSegments: 5,
    material: { roughness: 0.4, sheen: 0.8 },
  },
  eyeSides: [-1, 1] as const,
  eye: {
    iris: {
      offset: [0.285, 0.35, 0.205] as Vec3,
      scale: [0.012, 0.036, 0.031] as Vec3,
      segments: [1, 16, 12] as const,
      material: { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06 },
    },
    pupil: {
      offset: [0.297, 0.35, 0.205] as Vec3,
      scale: [0.004, 0.022, 0.019] as Vec3,
      segments: [1, 12, 8] as const,
      material: { roughness: 0.08, clearcoat: 1 },
    },
    glint: {
      offset: [0.302, 0.36, 0.215] as Vec3,
      scale: [0.003, 0.007, 0.007] as Vec3,
      segments: [1, 8, 6] as const,
    },
  },
} as const;
