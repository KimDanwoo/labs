import { WORLDS, findRoute, type Point, type Region } from '@shared/world/world';

/** Dead ends of the painted lanes: where a passing animal can appear from and disappear into. */
export function laneEnds(region: Region): Point[] {
  const { nodes, routes } = WORLDS[region];
  const degree = new Map<string, number>();
  for (const { a, b } of routes) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  return nodes.filter((node) => degree.get(node.id) === 1).map(({ x, z }) => ({ x, z }));
}

/** A walk from one lane end to another, along the lanes, or null when the painting has no such pair. */
export function passingRoute(region: Region, random: () => number): Point[] | null {
  const ends = laneEnds(region);
  if (ends.length < 2) return null;
  const from = ends[Math.floor(random() * ends.length)]!;
  const others = ends.filter((end) => end !== from);
  const to = others[Math.floor(random() * others.length)]!;
  const path = findRoute(from, to, region);
  return path.length ? [from, ...path] : null;
}

export type Stroll = { path: Point[]; leg: number; along: number };

/** Moves `distance` along the path; returns the new stroll and where it now stands, or null once it has left. */
export function strollOn(stroll: Stroll, distance: number): { stroll: Stroll; at: Point; dx: number } | null {
  let { leg, along } = stroll;
  let remaining = distance;
  while (leg < stroll.path.length - 1) {
    const a = stroll.path[leg]!;
    const b = stroll.path[leg + 1]!;
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    if (along + remaining <= length) {
      along += remaining;
      const t = length ? along / length : 1;
      return {
        stroll: { ...stroll, leg, along },
        at: { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t },
        dx: b.x - a.x,
      };
    }
    remaining -= length - along;
    leg += 1;
    along = 0;
  }
  return null;
}

/** Distance along a whole path. */
export const routeLength = (path: Point[]) =>
  path.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - path[i]!.x, b.z - path[i]!.z), 0);

/** Nearer the viewer (larger z) an animal covers more of the painting per second. */
export const depthPace = (z: number) => Math.min(1, Math.max(0.45, (z - 15) / 70));

const TURN_THRESHOLD = 0.01;
export type Gait = { stroll: Stroll; at: Point; walked: number; phase: number; isFacingLeft: boolean };

/** Starts a gait at the first point of a path, already facing the way its first sideways leg goes. */
export function startGait(path: Point[]): Gait {
  const firstTurn = path.findIndex((point, i) => i > 0 && Math.abs(point.x - path[i - 1]!.x) > TURN_THRESHOLD);
  const isFacingLeft = firstTurn > 0 && path[firstTurn]!.x < path[firstTurn - 1]!.x;
  return { stroll: { path, leg: 0, along: 0 }, at: path[0]!, walked: 0, phase: 0, isFacingLeft };
}

/**
 * Walks a gait for `seconds` at a pace set by where the animal stands now, so speed and stride never jump at a
 * corner; `phase` counts strides walked. Keeps facing the same way on legs that go straight up or down the
 * painting. Null once it has walked off the end.
 */
export function walkOn(gait: Gait, { speed, stride }: { speed: number; stride: number }, seconds: number) {
  const distance = speed * depthPace(gait.at.z) * seconds;
  const moved = strollOn(gait.stroll, distance);
  if (!moved) return null;
  const isTurning = Math.abs(moved.dx) > TURN_THRESHOLD;
  return {
    stroll: moved.stroll,
    at: moved.at,
    walked: gait.walked + distance,
    phase: gait.phase + (speed * seconds) / stride,
    isFacingLeft: isTurning ? moved.dx < 0 : gait.isFacingLeft,
  } satisfies Gait;
}

/** 0–1 visibility as an animal steps out of a lane end and fades back into the far one. */
export const presence = (walked: number, total: number, fadeIn: number, fadeOut: number) =>
  Math.max(0, Math.min(1, walked / fadeIn, (total - walked) / fadeOut));
