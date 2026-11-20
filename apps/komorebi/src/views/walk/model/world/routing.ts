import { canWalk, clearSegment } from '@views/walk/model/world/movement';
import { type Point, type Region, type RouteNode } from '@views/walk/model/world/world';
import { WORLDS } from '@views/walk/model/world/worlds';

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
interface NodeSearch {
  costs: Map<string, number>;
  previous: Map<string, string>;
}

function relaxNodeCosts(current: string, region: Region, { costs, previous }: NodeSearch) {
  for (const edge of groundConnections(region).filter((e) => e.a.id === current || e.b.id === current)) {
    const other = edge.a.id === current ? edge.b.id : edge.a.id;
    const cost = costs.get(current)! + edge.distance;
    if (cost < (costs.get(other) ?? Infinity)) {
      costs.set(other, cost);
      previous.set(other, current);
    }
  }
}

function searchNodes(start: Point, region: Region): NodeSearch {
  const nodes = WORLDS[region].nodes;
  const search: NodeSearch = {
    costs: new Map<string, number>(
      nodes
        .filter((node) => clearSegment(start, node, region))
        .map((node) => [node.id, Math.hypot(node.x - start.x, node.z - start.z)]),
    ),
    previous: new Map<string, string>(),
  };
  const unvisited = new Set(nodes.map((n) => n.id));
  while (unvisited.size) {
    const current = [...unvisited].sort(
      (a, b) => (search.costs.get(a) ?? Infinity) - (search.costs.get(b) ?? Infinity),
    )[0]!;
    if (!Number.isFinite(search.costs.get(current))) break;
    unvisited.delete(current);
    relaxNodeCosts(current, region, search);
  }
  return search;
}

function closestExitNode(target: Point, region: Region, costs: Map<string, number>): RouteNode | undefined {
  return WORLDS[region].nodes
    .filter((node) => costs.has(node.id) && clearSegment(node, target, region))
    .sort(
      (a, b) =>
        costs.get(a.id)! +
        Math.hypot(a.x - target.x, a.z - target.z) -
        (costs.get(b.id)! + Math.hypot(b.x - target.x, b.z - target.z)),
    )[0];
}

export function findRoute(start: Point, target: Point, region: Region): Point[] {
  const world = WORLDS[region];
  if (!canWalk(start.x, start.z, region)) return [];
  if (!canWalk(target.x, target.z, region)) return [];
  if (clearSegment(start, target, region)) return [{ ...target }];
  const { costs, previous } = searchNodes(start, region);
  const to = closestExitNode(target, region, costs);
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
const GROUND_STEP = 0.5;
const GROUND_SIZE = 201;
const SEED_RANGE = 2;
const NEIGHBOUR_RANGE = 1;
const GOAL_RADIUS = 1.5;
const groundGrids = new Map<Region, Uint8Array>();

interface GroundSearch {
  grid: Uint8Array;
  costs: Map<number, number>;
  previous: Map<number, number>;
  open: Set<number>;
  closed: Set<number>;
}

const groundPoint = (id: number): Point => ({
  x: (id % GROUND_SIZE) * GROUND_STEP,
  z: Math.floor(id / GROUND_SIZE) * GROUND_STEP,
});

const gridIdAt = (x: number, z: number): number | null => {
  const isOffGrid = x < 0 || x >= GROUND_SIZE || z < 0 || z >= GROUND_SIZE;
  return isOffGrid ? null : z * GROUND_SIZE + x;
};

const isFreeCell = (search: GroundSearch, id: number | null): id is number =>
  id !== null && !!search.grid[id] && !search.closed.has(id);

function getGroundGrid(region: Region): Uint8Array {
  const cached = groundGrids.get(region);
  if (cached) return cached;
  const grid = new Uint8Array(GROUND_SIZE * GROUND_SIZE);
  for (let id = 0; id < grid.length; id++) {
    grid[id] = Number(canWalk((id % GROUND_SIZE) * GROUND_STEP, Math.floor(id / GROUND_SIZE) * GROUND_STEP, region));
  }
  groundGrids.set(region, grid);
  return grid;
}

function seedGroundSearch(search: GroundSearch, start: Point, region: Region) {
  const sx = Math.round(start.x / GROUND_STEP),
    sz = Math.round(start.z / GROUND_STEP);
  for (let dz = -SEED_RANGE; dz <= SEED_RANGE; dz++)
    for (let dx = -SEED_RANGE; dx <= SEED_RANGE; dx++) {
      const id = gridIdAt(sx + dx, sz + dz);
      if (!isFreeCell(search, id)) continue;
      if (!clearSegment(start, groundPoint(id), region)) continue;
      const cell = groundPoint(id);
      search.costs.set(id, Math.hypot(cell.x - start.x, cell.z - start.z));
      search.open.add(id);
    }
}

function bestOpenCell({ open, costs }: GroundSearch, target: Point): number {
  let current = -1,
    best = Infinity;
  for (const id of open) {
    const p = groundPoint(id);
    const score = costs.get(id)! + Math.hypot(target.x - p.x, target.z - p.z);
    if (score < best) {
      current = id;
      best = score;
    }
  }
  return current;
}

function smoothPath(path: Point[], start: Point, region: Region): Point[] {
  const result: Point[] = [];
  let anchor = start;
  for (let i = 0; i < path.length; i++) {
    const canSkipNext = i + 1 < path.length && clearSegment(anchor, path[i + 1]!, region);
    if (canSkipNext) continue;
    anchor = path[i]!;
    result.push(anchor);
  }
  return result;
}

function tracePath(search: GroundSearch, goal: number, target: Point): Point[] {
  const path = [target, groundPoint(goal)];
  let current = goal;
  while (search.previous.has(current)) {
    current = search.previous.get(current)!;
    path.push(groundPoint(current));
  }
  return path.reverse();
}

function expandGroundSearch(search: GroundSearch, current: number, region: Region) {
  const from = groundPoint(current);
  for (let dz = -NEIGHBOUR_RANGE; dz <= NEIGHBOUR_RANGE; dz++)
    for (let dx = -NEIGHBOUR_RANGE; dx <= NEIGHBOUR_RANGE; dx++) {
      const isSameCell = !dx && !dz;
      if (isSameCell) continue;
      const id = gridIdAt((current % GROUND_SIZE) + dx, Math.floor(current / GROUND_SIZE) + dz);
      if (!isFreeCell(search, id)) continue;
      const cost = search.costs.get(current)! + Math.hypot(dx, dz) * GROUND_STEP;
      if (cost >= (search.costs.get(id) ?? Infinity)) continue;
      if (!clearSegment(from, groundPoint(id), region)) continue;
      search.costs.set(id, cost);
      search.previous.set(id, current);
      search.open.add(id);
    }
}

function findGroundRoute(start: Point, target: Point, region: Region): Point[] {
  const search: GroundSearch = {
    grid: getGroundGrid(region),
    costs: new Map(),
    previous: new Map(),
    open: new Set(),
    closed: new Set(),
  };
  seedGroundSearch(search, start, region);
  while (search.open.size) {
    const current = bestOpenCell(search, target);
    const from = groundPoint(current);
    const hasReachedGoal =
      Math.hypot(from.x - target.x, from.z - target.z) <= GOAL_RADIUS && clearSegment(from, target, region);
    if (hasReachedGoal) {
      return smoothPath(tracePath(search, current, target), start, region);
    }
    search.open.delete(current);
    search.closed.add(current);
    expandGroundSearch(search, current, region);
  }
  return [];
}
