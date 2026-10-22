import { WORLDS, canWalk, type Point, type Region } from './world';

export type WorldPortal = {
  node: string;
  to: Region;
  spawn: Point;
  label: string;
  center: Point;
  edge: 'left' | 'right' | 'top' | 'bottom';
  boundary: number;
  lateralRange: readonly [number, number];
};

// Exit spans follow the painted connecting road, not every path touching that screen edge.
const EXIT_SPANS: Record<Region, Record<string, readonly [number, number]>> = {
  village: { bottom: [33, 65], forestgate: [32, 39], rivergate: [37, 42] },
  river: { back: [45, 52], coastgate: [43, 54] },
  coast: { back: [52, 62] },
  forest: { back: [40, 61] },
  school: { gate: [45, 61] },
  shops: { schoolgate: [50, 66], villagegate: [49, 59] },
};

const portals = Object.fromEntries(
  (Object.keys(WORLDS) as Region[]).map((region) => [
    region,
    WORLDS[region].portals.map((portal): WorldPortal => {
      const end = WORLDS[region].nodes.find((node) => node.id === portal.node)!;
      const edge = end.x < 10 ? 'left' : end.x > 90 ? 'right' : end.z > 80 ? 'bottom' : 'top';
      const boundary = edge === 'left' ? 4 : edge === 'right' ? 97 : edge === 'bottom' ? 96 : 28;
      const center =
        edge === 'left'
          ? { x: 3.5, z: end.z }
          : edge === 'right'
            ? { x: 97.5, z: end.z }
            : edge === 'bottom'
              ? { x: end.x, z: 96.5 }
              : { x: 52, z: 27.5 };
      return { ...portal, edge, boundary, center, lateralRange: EXIT_SPANS[region][portal.node]! };
    }),
  ]),
) as Record<Region, WorldPortal[]>;

export function getWorldPortals(region: Region) {
  return portals[region];
}

/** The whole road beyond the exit boundary transfers, regardless of lateral position. */
export function isInsidePortal(position: Point, portal: WorldPortal) {
  const lateral = portal.edge === 'left' || portal.edge === 'right' ? position.z : position.x;
  if (lateral < portal.lateralRange[0] || lateral > portal.lateralRange[1]) return false;
  switch (portal.edge) {
    case 'left':
      return position.x <= portal.boundary;
    case 'right':
      return position.x >= portal.boundary;
    case 'top':
      return position.z <= portal.boundary;
    case 'bottom':
      return position.z >= portal.boundary;
  }
}

export function portalAt(position: Point, region: Region) {
  if (!canWalk(position.x, position.z, region)) return null;
  return portals[region].find((portal) => isInsidePortal(position, portal)) ?? null;
}
