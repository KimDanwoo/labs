export const FLORA_VIEW = {
  trunk: { roughness: 0.95, bumpScale: 0.16 },
  canopy: { roughness: 0.82, envMapIntensity: 0.25 },
  shadow: { color: '#293221', opacity: 0.3, geometry: [1, 1] },
  rock: { roughness: 0.95, bumpScale: 0.12 },
} as const;
