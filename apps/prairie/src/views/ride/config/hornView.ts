export const HORN_VIEW = {
  ring: { radiusScale: 1.06, tube: 0.013, radialSegments: 8, tubularSegments: 32, roughness: 0.25, metalness: 0.65 },
  gem: {
    y: 0.035,
    zRadiusScale: 1.2,
    scale: [0.075, 0.13, 0.045],
    color: '#81cde0',
    metalness: 0.3,
    roughness: 0.15,
  },
  body: { roughness: 0.3, metalness: 0.55 },
  ridge: { roughness: 0.35, metalness: 0.35 },
  gemGeometry: [1, 0],
} as const;
