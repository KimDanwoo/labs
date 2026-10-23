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
