import { WORLDS, canWalk, type Point, type Region } from './world';

export type WorldPortal = {
  node: string;
  to: Region;
  spawn: Point;
  label: string;
  center: Point;
  edge: 'left' | 'right' | 'top' | 'bottom';
  boundary: number;
  extent?: number;
  lateralRange: readonly [number, number];
};

// Exit spans follow the painted connecting road, not every path touching that screen edge.
const EXIT_SPANS: Record<Region, Record<string, readonly [number, number]>> = {
  home: {},
  hallway: {},
  classroom: {},
  village: { bottom: [33, 65], forestgate: [32, 39], rivergate: [37, 42] },
  river: { back: [45, 52], coastgate: [43, 54] },
  coast: { back: [52, 62] },
  forest: { back: [40, 61] },
  school: { gate: [45, 61] },
  shops: { schoolgate: [50, 66], villagegate: [49, 59] },
};

type Doorway = Pick<WorldPortal, 'edge' | 'boundary' | 'center' | 'lateralRange'> & { extent: number };

// Doorways are small thresholds inside a painting, unlike the road exits at its edges.
const DOORWAYS: Partial<Record<Region, Partial<Record<Region, Doorway>>>> = {
  village: {
    home: { edge: 'top', boundary: 38.5, center: { x: 15, z: 38 }, lateralRange: [13.5, 16.5], extent: 2 },
  },
  home: {
    village: { edge: 'left', boundary: 24, center: { x: 23.5, z: 65 }, lateralRange: [61, 70], extent: 3 },
  },
  school: {
    hallway: { edge: 'top', boundary: 35.5, center: { x: 52, z: 35 }, lateralRange: [49.5, 54.5], extent: 1.5 },
  },
  hallway: {
    school: { edge: 'top', boundary: 61, center: { x: 16, z: 60 }, lateralRange: [12.5, 21], extent: 2 },
    classroom: { edge: 'top', boundary: 62.5, center: { x: 68.5, z: 62 }, lateralRange: [66, 71], extent: 2 },
  },
  classroom: {
    hallway: { edge: 'right', boundary: 94, center: { x: 95, z: 62.5 }, lateralRange: [59, 66], extent: 3 },
  },
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
      const doorway = DOORWAYS[region]?.[portal.to];
      if (doorway) return { ...portal, ...doorway };
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
  const axial = portal.edge === 'left' || portal.edge === 'right' ? position.x : position.z;
  if (portal.extent !== undefined && Math.abs(axial - portal.boundary) > portal.extent) return false;
  return BEYOND_BOUNDARY[portal.edge](position, portal.boundary);
}

export function portalAt(position: Point, region: Region) {
  if (!canWalk(position.x, position.z, region)) return null;
  return portals[region].find((portal) => isInsidePortal(position, portal)) ?? null;
}
