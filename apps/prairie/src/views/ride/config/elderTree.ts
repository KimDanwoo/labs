export const ELDER_TREE = {
  crownCanopy: { radius: 3.6, leaves: 240 },
  tipCanopy: { radius: 2.6, leaves: 140 },
  trunk: {
    points: [
      [0, 0, 0],
      [-1.4, 4, 0.2],
      [-0.5, 9, 0],
      [2, 14, 0],
    ],
    radius: 1.5,
  },
  rootCount: 5,
  rootRadius: 0.45,
  clusterCount: 9,
  sway: { rate: 0.45, amplitude: 0.012 },
  crownScale: [1.6, 0.65, 1.1],
  tipScale: [1.5, 0.4, 1],
  leafRoughness: 0.85,
} as const;
