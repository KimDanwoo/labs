export const GARDEN_PLANTING = {
  stemCount: 100,
  patchSize: 20,
  patchRadius: 9,
  patchAngleStep: 1.256,
  goldenAngle: 2.39996,
  spreadBase: 0.5,
  spreadStep: 0.13,
  heightBase: 0.5,
  heightVariants: 5,
  heightStep: 0.12,
  stemWidth: 0.025,
  swayAmplitude: 0.06,
  petal: {
    count: 5,
    angleStep: Math.PI * 0.4,
    ringRadius: 0.15,
    tilt: 0.3,
    scale: [0.21, 0.055, 0.11],
  },
  vine: {
    leavesPerColumn: 13,
    columns: 8,
    ringRadius: 11,
    twistStep: 0.65,
    coilRadius: 0.95,
    riseBase: 2.5,
    riseVariants: 3,
    riseDivisor: 14,
    leanOdd: 0.08,
    leanEven: -0.04,
    leafTilt: 0.4,
    leafRoll: 0.5,
    leafScale: [0.2, 0.1, 0.38],
  },
} as const;

export const GARDEN_GEOMETRY = {
  bloom: [1, 6, 4],
  stem: [1, 1, 1, 4],
  leaf: [1, 0],
} as const;

export const GARDEN_BLOOM_COUNT = GARDEN_PLANTING.stemCount * GARDEN_PLANTING.petal.count;
