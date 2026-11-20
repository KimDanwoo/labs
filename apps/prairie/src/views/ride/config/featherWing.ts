export const FEATHER_WING = {
  feather: { roughness: 0.5, sheen: 0.75, sheenRoughness: 0.55 },
  trim: {
    position: [0.65, 0.13, -0.1],
    scale: [0.8, 0.13, 0.16],
    geometry: [1, 16, 10],
    roughness: 0.55,
    sheen: 0.6,
  },
  ring: {
    position: [0.22, 0.13, -0.1],
    geometry: [0.14, 0.018, 6, 20],
    metalness: 0.75,
    roughness: 0.28,
  },
} as const;
