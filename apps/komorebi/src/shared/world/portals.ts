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

type Edge = WorldPortal['edge'];

function portalEdge(end: Point): Edge {
  if (end.x < 10) return 'left';
  if (end.x > 90) return 'right';
  return end.z > 80 ? 'bottom' : 'top';
}

const EDGE_GEOMETRY = {
  left: (end) => ({ boundary: 4, center: { x: 3.5, z: end.z } }),
  right: (end) => ({ boundary: 97, center: { x: 97.5, z: end.z } }),
  bottom: (end) => ({ boundary: 96, center: { x: end.x, z: 96.5 } }),
  top: () => ({ boundary: 28, center: { x: 52, z: 27.5 } }),
} satisfies Record<Edge, (end: Point) => { boundary: number; center: Point }>;

const portals = Object.fromEntries(
  (Object.keys(WORLDS) as Region[]).map((region) => [
    region,
    WORLDS[region].portals.map((portal): WorldPortal => {
      const end = WORLDS[region].nodes.find((node) => node.id === portal.node)!;
      const edge = portalEdge(end);
      const { boundary, center } = EDGE_GEOMETRY[edge](end);
      return { ...portal, edge, boundary, center, lateralRange: EXIT_SPANS[region][portal.node]! };
    }),
  ]),
) as Record<Region, WorldPortal[]>;

export function getWorldPortals(region: Region) {
  return portals[region];
}

const BEYOND_BOUNDARY = {
  left: (position, boundary) => position.x <= boundary,
  right: (position, boundary) => position.x >= boundary,
  top: (position, boundary) => position.z <= boundary,
  bottom: (position, boundary) => position.z >= boundary,
} satisfies Record<Edge, (position: Point, boundary: number) => boolean>;

/** The whole road beyond the exit boundary transfers, regardless of lateral position. */
export function isInsidePortal(position: Point, portal: WorldPortal) {
  const lateral = portal.edge === 'left' || portal.edge === 'right' ? position.z : position.x;
  if (lateral < portal.lateralRange[0] || lateral > portal.lateralRange[1]) return false;
  return BEYOND_BOUNDARY[portal.edge](position, portal.boundary);
}

export function portalAt(position: Point, region: Region) {
  if (!canWalk(position.x, position.z, region)) return null;
  return portals[region].find((portal) => isInsidePortal(position, portal)) ?? null;
}
