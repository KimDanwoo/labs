import type { Point, Region } from './world';

export const SURFACE = { dirt: 'dirt', stone: 'stone', wood: 'wood', sand: 'sand' } as const;
export type Surface = (typeof SURFACE)[keyof typeof SURFACE];

type Zone = { surface: Surface; minX: number; maxX: number; minZ: number; maxZ: number };

/** What the painted ground underfoot is made of: a default per painting, with zones for bridges and paths. */
const SURFACES: Record<Region, { base: Surface; zones: Zone[] }> = {
  village: { base: SURFACE.dirt, zones: [{ surface: SURFACE.wood, minX: 80, maxX: 96, minZ: 37, maxZ: 46 }] },
  river: { base: SURFACE.dirt, zones: [{ surface: SURFACE.wood, minX: 25, maxX: 72, minZ: 41, maxZ: 55 }] },
  coast: { base: SURFACE.stone, zones: [] },
  forest: { base: SURFACE.stone, zones: [] },
  school: { base: SURFACE.sand, zones: [{ surface: SURFACE.dirt, minX: 40, maxX: 62, minZ: 88, maxZ: 100 }] },
  shops: { base: SURFACE.stone, zones: [] },
};

export function surfaceAt(point: Point, region: Region): Surface {
  const { base, zones } = SURFACES[region];
  const zone = zones.find((z) => point.x >= z.minX && point.x <= z.maxX && point.z >= z.minZ && point.z <= z.maxZ);
  return zone?.surface ?? base;
}
