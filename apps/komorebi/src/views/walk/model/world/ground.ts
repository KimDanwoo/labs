import { GROUND } from '@views/walk/model/world/groundOutlines';
import { WORLD_OBJECTS } from '@views/walk/model/world/objects';
import type { Point, Region } from '@views/walk/model/world/world';

export type PixelPoint = readonly [number, number];

function prepareGeometry(polygons: readonly PixelPoint[][]) {
  return polygons.map((outline) => ({
    outline,
    minX: Math.min(...outline.map(([x]) => x)),
    maxX: Math.max(...outline.map(([x]) => x)),
    minY: Math.min(...outline.map(([, y]) => y)),
    maxY: Math.max(...outline.map(([, y]) => y)),
    edges: outline.map((a, i) => {
      const b = outline[(i + 1) % outline.length]!;
      return {
        a,
        b,
        minX: Math.min(a[0], b[0]),
        maxX: Math.max(a[0], b[0]),
        minY: Math.min(a[1], b[1]),
        maxY: Math.max(a[1], b[1]),
      };
    }),
  }));
}
const GROUND_GEOMETRY = {
  home: prepareGeometry(GROUND.home),
  village: prepareGeometry(GROUND.village),
  river: prepareGeometry(GROUND.river),
  coast: prepareGeometry(GROUND.coast),
  forest: prepareGeometry(GROUND.forest),
  school: prepareGeometry(GROUND.school),
  shops: prepareGeometry(GROUND.shops),
  hallway: prepareGeometry(GROUND.hallway),
  classroom: prepareGeometry(GROUND.classroom),
};
const OBJECT_GEOMETRY = WORLD_OBJECTS.map((object) => ({
  region: object.region,
  ...prepareGeometry([object.footprint])[0]!,
}));
const COLLISION_GEOMETRY = Object.fromEntries(
  Object.entries(GROUND_GEOMETRY).map(([region, shapes]) => [
    region,
    [...shapes, ...OBJECT_GEOMETRY.filter((object) => object.region === region)],
  ]),
);

function contains(outline: readonly PixelPoint[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, ay] = outline[i]!;
    const [bx, by] = outline[j]!;
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

const FOOT_SAMPLES: readonly PixelPoint[] = [
  [-13, -4],
  [0, -4],
  [13, -4],
  [-13, 0],
  [0, 0],
  [13, 0],
  [-13, 4],
  [0, 4],
  [13, 4],
];

export function isOnGround(x: number, z: number, region: Region) {
  const scale = Math.max(0.45, Math.min(1, (z - 15) / 70));
  return FOOT_SAMPLES.every(([dx, dy]) => {
    const px = x * 15.36 + dx * scale,
      py = z * 10.24 + dy * scale;
    if (
      OBJECT_GEOMETRY.some(
        (object) =>
          object.region === region &&
          px >= object.minX &&
          px <= object.maxX &&
          py >= object.minY &&
          py <= object.maxY &&
          contains(object.outline, px, py),
      )
    )
      return false;
    return GROUND_GEOMETRY[region].some(
      (shape) =>
        px >= shape.minX && px <= shape.maxX && py >= shape.minY && py <= shape.maxY && contains(shape.outline, px, py),
    );
  });
}

type Edge = ReturnType<typeof prepareGeometry>[number]['edges'][number];

const DEPTH_CUTS = [46.5, 85];
const PARALLEL_EPSILON = 1e-10;

const pointAlong = (from: Point, to: Point, t: number): Point => ({
  x: from.x + (to.x - from.x) * t,
  z: from.z + (to.z - from.z) * t,
});

const footPoint = (p: Point, dx: number, dy: number): PixelPoint => {
  const scale = Math.max(0.45, Math.min(1, (p.z - 15) / 70));
  return [p.x * 15.36 + dx * scale, p.z * 10.24 + dy * scale];
};

const depthCuts = (from: Point, to: Point): number[] => {
  const cuts = [0, 1];
  if (to.z === from.z) return cuts;
  for (const depth of DEPTH_CUTS) {
    const t = (depth - from.z) / (to.z - from.z);
    if (t > 0 && t < 1) cuts.push(t);
  }
  return cuts.sort((a, b) => a - b);
};

const isBoundsApart = (a: PixelPoint, b: PixelPoint, edge: Edge) =>
  Math.max(a[0], b[0]) < edge.minX ||
  Math.min(a[0], b[0]) > edge.maxX ||
  Math.max(a[1], b[1]) < edge.minY ||
  Math.min(a[1], b[1]) > edge.maxY;

const isProperCrossing = (t: number, u: number) => t > 0 && t < 1 && u >= 0 && u <= 1;

function edgeCrossing(a: PixelPoint, b: PixelPoint, edge: Edge): number | null {
  if (isBoundsApart(a, b, edge)) return null;
  const vx = b[0] - a[0],
    vy = b[1] - a[1];
  const c = edge.a,
    d = edge.b;
  const wx = d[0] - c[0],
    wy = d[1] - c[1];
  const denominator = vx * wy - vy * wx;
  if (Math.abs(denominator) < PARALLEL_EPSILON) return null;
  const cx = c[0] - a[0],
    cy = c[1] - a[1];
  const t = (cx * wy - cy * wx) / denominator;
  const u = (cx * vy - cy * vx) / denominator;
  return isProperCrossing(t, u) ? t : null;
}

function spanCrossings(from: Point, to: Point, lo: number, hi: number, region: Region): number[] {
  const crossings: number[] = [];
  const edges = COLLISION_GEOMETRY[region]!.flatMap((shape) => shape.edges);
  for (const [dx, dy] of FOOT_SAMPLES) {
    const a = footPoint(pointAlong(from, to, lo), dx, dy),
      b = footPoint(pointAlong(from, to, hi), dx, dy);
    for (const edge of edges) {
      const t = edgeCrossing(a, b, edge);
      if (t !== null) crossings.push(lo + t * (hi - lo));
    }
  }
  return crossings;
}

function isSpanOnGround(from: Point, to: Point, lo: number, hi: number, region: Region): boolean {
  const crossings = [lo, hi, ...spanCrossings(from, to, lo, hi, region)].sort((a, b) => a - b);
  for (let i = 1; i < crossings.length; i++) {
    const p = pointAlong(from, to, (crossings[i - 1]! + crossings[i]!) / 2);
    if (!isOnGround(p.x, p.z, region)) return false;
  }
  return true;
}

export function hasGroundBetween(from: Point, to: Point, region: Region): boolean {
  const cuts = depthCuts(from, to);
  for (let k = 1; k < cuts.length; k++) {
    if (!isSpanOnGround(from, to, cuts[k - 1]!, cuts[k]!, region)) return false;
  }
  return isOnGround(from.x, from.z, region) && isOnGround(to.x, to.z, region);
}
