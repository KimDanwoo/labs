import { canWalk, clearSegment } from './movement';
import { type Point, type Region, type RouteNode } from './world';
import { WORLDS } from './worlds';

export function nextRegionStep(from: Region, to: Region): Region | null {
  if (from === to) return null;
  const queue: Region[][] = [[from]],
    visited = new Set<Region>([from]);
  while (queue.length) {
    const path = queue.shift()!;
    for (const portal of WORLDS[path[path.length - 1]!].portals) {
      if (visited.has(portal.to)) continue;
      const next = [...path, portal.to];
      if (portal.to === to) return next[1]!;
      visited.add(portal.to);
      queue.push(next);
    }
  }
  return null;
}
const navigationEdges = new Map<Region, { a: RouteNode; b: RouteNode; distance: number }[]>();
function groundConnections(region: Region) {
  const cached = navigationEdges.get(region);
  if (cached) return cached;
  const nodes = WORLDS[region].nodes;
  const edges = nodes.flatMap((a, index) =>
    nodes
      .slice(index + 1)
      .filter((b) => clearSegment(a, b, region))
      .map((b) => ({ a, b, distance: Math.hypot(a.x - b.x, a.z - b.z) })),
  );
  navigationEdges.set(region, edges);
  return edges;
}
export function findRoute(start: Point, target: Point, region: Region): Point[] {
  const world = WORLDS[region];
  if (!canWalk(start.x, start.z, region) || !canWalk(target.x, target.z, region)) return [];
  if (clearSegment(start, target, region)) return [{ ...target }];
  // Evaluate every visible connection: the nearest node may lead backwards
  // through the return portal even when the destination is in the other direction.
  const costs = new Map<string, number>(
      world.nodes
        .filter((node) => clearSegment(start, node, region))
        .map((node) => [node.id, Math.hypot(node.x - start.x, node.z - start.z)]),
    ),
    previous = new Map<string, string>(),
    unvisited = new Set(world.nodes.map((n) => n.id));
  while (unvisited.size) {
    const current = [...unvisited].sort((a, b) => (costs.get(a) ?? Infinity) - (costs.get(b) ?? Infinity))[0]!;
    if (!Number.isFinite(costs.get(current))) break;
    unvisited.delete(current);
    for (const edge of groundConnections(region).filter((e) => e.a.id === current || e.b.id === current)) {
      const other = edge.a.id === current ? edge.b.id : edge.a.id;
      const cost = costs.get(current)! + edge.distance;
      if (cost < (costs.get(other) ?? Infinity)) {
        costs.set(other, cost);
        previous.set(other, current);
      }
    }
  }
  const to = world.nodes
    .filter((node) => costs.has(node.id) && clearSegment(node, target, region))
    .sort(
      (a, b) =>
        costs.get(a.id)! +
        Math.hypot(a.x - target.x, a.z - target.z) -
        (costs.get(b.id)! + Math.hypot(b.x - target.x, b.z - target.z)),
    )[0];
  if (!to) return findGroundRoute(start, target, region);
  const ids = [to.id];
  while (previous.has(ids[0]!)) ids.unshift(previous.get(ids[0]!)!);
  const result: Point[] = ids.map((id) => {
    const n = world.nodes.find((n) => n.id === id)!;
    return { x: n.x, z: n.z };
  });
  if (canWalk(target.x, target.z, region)) result.push(target);
  return result;
}
// A painted side path may contain no authored guide nodes. Search its actual floor.
const GROUND_STEP = 0.5;
const GROUND_SIZE = 201;
const groundGrids = new Map<Region, Uint8Array>();
function findGroundRoute(start: Point, target: Point, region: Region): Point[] {
  let grid = groundGrids.get(region);
  if (!grid) {
    grid = new Uint8Array(GROUND_SIZE * GROUND_SIZE);
    for (let id = 0; id < grid.length; id++) {
      grid[id] = Number(canWalk((id % GROUND_SIZE) * GROUND_STEP, Math.floor(id / GROUND_SIZE) * GROUND_STEP, region));
    }
    groundGrids.set(region, grid);
  }
  const point = (id: number): Point => ({
    x: (id % GROUND_SIZE) * GROUND_STEP,
    z: Math.floor(id / GROUND_SIZE) * GROUND_STEP,
  });
  const costs = new Map<number, number>();
  const previous = new Map<number, number>();
  const open = new Set<number>();
  const closed = new Set<number>();
  const sx = Math.round(start.x / GROUND_STEP),
    sz = Math.round(start.z / GROUND_STEP);
  for (let dz = -2; dz <= 2; dz++)
    for (let dx = -2; dx <= 2; dx++) {
      const x = sx + dx,
        z = sz + dz;
      if (x < 0 || x >= GROUND_SIZE || z < 0 || z >= GROUND_SIZE) continue;
      const id = z * GROUND_SIZE + x;
      if (!grid[id] || !clearSegment(start, point(id), region)) continue;
      costs.set(id, Math.hypot(point(id).x - start.x, point(id).z - start.z));
      open.add(id);
    }
  while (open.size) {
    let current = -1,
      best = Infinity;
    for (const id of open) {
      const p = point(id);
      const score = costs.get(id)! + Math.hypot(target.x - p.x, target.z - p.z);
      if (score < best) {
        current = id;
        best = score;
      }
    }
    const from = point(current);
    if (Math.hypot(from.x - target.x, from.z - target.z) <= 1.5 && clearSegment(from, target, region)) {
      const path = [target, from];
      while (previous.has(current)) {
        current = previous.get(current)!;
        path.push(point(current));
      }
      path.reverse();
      const result: Point[] = [];
      let anchor = start;
      for (let i = 0; i < path.length; i++) {
        if (i + 1 < path.length && clearSegment(anchor, path[i + 1]!, region)) continue;
        anchor = path[i]!;
        result.push(anchor);
      }
      return result;
    }
    open.delete(current);
    closed.add(current);
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const x = (current % GROUND_SIZE) + dx,
          z = Math.floor(current / GROUND_SIZE) + dz;
        if (x < 0 || x >= GROUND_SIZE || z < 0 || z >= GROUND_SIZE) continue;
        const id = z * GROUND_SIZE + x;
        if (!grid[id] || closed.has(id)) continue;
        const cost = costs.get(current)! + Math.hypot(dx, dz) * GROUND_STEP;
        if (cost >= (costs.get(id) ?? Infinity) || !clearSegment(from, point(id), region)) continue;
        costs.set(id, cost);
        previous.set(id, current);
        open.add(id);
      }
  }
  return [];
}
