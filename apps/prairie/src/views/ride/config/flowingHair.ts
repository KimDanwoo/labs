export const FLOWING_HAIR = {
  strandsLow: 28,
  rings: 12,
  sides: 6,
  radius: 0.035,
  taperPower: 0.8,
  taperRatio: 0.97,
  tint: { base: 0.18, along: 0.65, wave: 0.12, waveRate: 2.4 },
  topOffset: { mane: { y: 0.35, z: 0.22 }, tail: { y: 0, z: 0 } },
  bottomOffset: { mane: { y: 0.3, z: 0.3 }, tail: { y: -0.25, z: 0 } },
  flow: { speedDivisor: 10, airborneGain: 0.05, max: 1.4 },
  material: { roughness: 0.34, metalness: 0.04, sheen: 0.85, sheenRoughness: 0.35 },
} as const;
