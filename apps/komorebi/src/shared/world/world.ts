export type Region = 'village' | 'river' | 'coast' | 'forest' | 'school' | 'shops';
export type Point = { x: number; z: number };
export type RouteNode = Point & { id: string };
export type Route = { a: string; b: string; width: number };
export const SPAWN: Point = { x: 50, z: 82 };
export const LANDMARKS = [
  {
    id: 'fields',
    region: 'village',
    name: '바람이 머무는 논',
    short: '논길',
    x: 62,
    z: 51,
    icon: '芽',
    text: '초록빛 파도가 발끝까지 밀려온다. 가만히 서 있으니, 벼 이삭들이 먼저 인사를 건넨다.',
  },
  {
    id: 'river',
    region: 'river',
    name: '물소리 다리',
    short: '강',
    x: 50,
    z: 47.7,
    icon: '川',
    text: '다리 아래로 여름이 흘러간다. 반짝이는 물결 속에 오늘의 구름이 잠깐 쉬어 간다.',
  },
  {
    id: 'sea',
    region: 'coast',
    name: '여름 끝의 바다',
    short: '바다',
    x: 65,
    z: 73,
    icon: '海',
    text: '길이 끝나는 곳에서 바다가 시작된다. 먼 곳으로 가는 배를 보며, 내일도 조금 더 걸어 보기로 한다.',
  },
  {
    id: 'shrine',
    region: 'forest',
    name: '숲속의 작은 소원',
    short: '산길',
    x: 50,
    z: 57,
    icon: '山',
    text: '나뭇잎 사이로 햇빛이 내려앉는다. 아무에게도 말하지 않은 작은 소원을 바람에게 맡긴다.',
  },
  {
    id: 'school',
    region: 'school',
    name: '방학 중인 우리 학교',
    short: '학교',
    x: 50,
    z: 39,
    icon: '校',
    text: '텅 빈 운동장이 오늘은 전부 내 차지다. 흙을 차며 달리다가 문득, 개학하면 친구에게 들려줄 이야기가 하나 더 생겼다.',
  },
  {
    id: 'shops',
    region: 'shops',
    name: '골목 끝 작은 상점가',
    short: '상점가',
    x: 50,
    z: 65,
    icon: '店',
    text: '빨간 차양 아래로 달콤한 냄새가 흘러나온다. 가게 앞 수박을 구경하다가, 돌아가는 길엔 시원한 아이스크림을 사 먹기로 한다.',
  },
] as const;
export type Landmark = (typeof LANDMARKS)[number];
export const WORLDS: Record<
  Region,
  {
    image: string;
    name: string;
    nodes: RouteNode[];
    routes: Route[];
    areas?: { minX: number; maxX: number; minZ: number; maxZ: number }[];
    portals: { node: string; to: Region; spawn: Point; label: string }[];
  }
> = {
  village: {
    image: '/art/village-game.webp',
    name: '파란 지붕 아래 논길',
    nodes: [
      { id: 'start', x: 50, z: 82 },
      { id: 'bottom', x: 50, z: 94 },
      { id: 'bend', x: 50, z: 65 },
      { id: 'fork', x: 50, z: 56 },
      { id: 'left', x: 32, z: 47 },
      { id: 'house', x: 17, z: 41 },
      { id: 'forestgate', x: 4, z: 35 },
      { id: 'fields', x: 62, z: 51 },
      { id: 'bridge', x: 82, z: 42.8 },
      { id: 'rivergate', x: 96, z: 39.5 },
    ],
    routes: [
      { a: 'bottom', b: 'start', width: 7 },
      { a: 'start', b: 'bend', width: 5.5 },
      { a: 'bend', b: 'fork', width: 5 },
      { a: 'fork', b: 'left', width: 3.3 },
      { a: 'left', b: 'house', width: 2.8 },
      { a: 'house', b: 'forestgate', width: 2.7 },
      { a: 'fork', b: 'fields', width: 3 },
      { a: 'fields', b: 'bridge', width: 1.2 },
      // Narrow diagonal deck, measured between the painted railings.
      { a: 'bridge', b: 'rivergate', width: 0.65 },
    ],
    portals: [
      { node: 'bottom', to: 'shops', spawn: { x: 50, z: 46 }, label: '상점가로' },
      { node: 'forestgate', to: 'forest', spawn: { x: 50, z: 88 }, label: '산길로' },
      { node: 'rivergate', to: 'river', spawn: { x: 12, z: 48 }, label: '강가로' },
    ],
  },
  river: {
    image: '/art/river-game.webp',
    name: '졸졸, 물소리 다리',
    nodes: [
      { id: 'back', x: 4, z: 48 },
      { id: 'entry', x: 14, z: 48 },
      { id: 'bank', x: 28, z: 48 },
      { id: 'river', x: 50, z: 47.7 },
      { id: 'east', x: 76, z: 47 },
      { id: 'coastgate', x: 96, z: 46 },
      { id: 'pathbend', x: 23, z: 68 },
      { id: 'picnic', x: 17, z: 88 },
    ],
    routes: [
      { a: 'back', b: 'entry', width: 3 },
      { a: 'entry', b: 'bank', width: 3 },
      { a: 'bank', b: 'river', width: 1.1 },
      { a: 'river', b: 'east', width: 1.1 },
      { a: 'east', b: 'coastgate', width: 3 },
      { a: 'bank', b: 'pathbend', width: 3.7 },
      { a: 'pathbend', b: 'picnic', width: 3.8 },
    ],
    portals: [
      { node: 'back', to: 'village', spawn: { x: 84, z: 42.33 }, label: '마을로' },
      { node: 'coastgate', to: 'coast', spawn: { x: 12, z: 62 }, label: '바다로' },
    ],
  },
  coast: {
    image: '/art/coast-game.webp',
    name: '바람 부는 바닷길',
    nodes: [
      { id: 'back', x: 4, z: 60 },
      { id: 'entry', x: 15, z: 64 },
      { id: 'middle', x: 40, z: 70 },
      { id: 'sea', x: 65, z: 73 },
      { id: 'end', x: 93, z: 77 },
    ],
    routes: [
      { a: 'back', b: 'entry', width: 3 },
      { a: 'entry', b: 'middle', width: 5 },
      { a: 'middle', b: 'sea', width: 5 },
      { a: 'sea', b: 'end', width: 4.5 },
    ],
    portals: [{ node: 'back', to: 'river', spawn: { x: 85, z: 47 }, label: '강가로' }],
  },
  forest: {
    image: '/art/forest-game.webp',
    name: '나뭇잎 사이의 산길',
    nodes: [
      { id: 'back', x: 50, z: 96 },
      { id: 'entry', x: 50, z: 88 },
      { id: 'center', x: 50, z: 74 },
      { id: 'left', x: 22, z: 75 },
      { id: 'right', x: 81, z: 75 },
      { id: 'steps', x: 50, z: 65 },
      { id: 'shrine', x: 50, z: 57 },
    ],
    routes: [
      { a: 'back', b: 'entry', width: 5 },
      { a: 'entry', b: 'center', width: 6 },
      { a: 'center', b: 'left', width: 6 },
      { a: 'center', b: 'right', width: 6 },
      { a: 'center', b: 'steps', width: 4 },
      { a: 'steps', b: 'shrine', width: 3.4 },
    ],
    portals: [{ node: 'back', to: 'village', spawn: { x: 16, z: 41 }, label: '마을로' }],
  },
  school: {
    image: '/art/school-game.webp',
    name: '방학 중인 작은 학교',
    nodes: [
      { id: 'gate', x: 50, z: 96 },
      { id: 'entry', x: 50, z: 86 },
      { id: 'center', x: 50, z: 70 },
      { id: 'school', x: 50, z: 39 },
      { id: 'left', x: 18, z: 72 },
      { id: 'right', x: 83, z: 72 },
    ],
    routes: [
      { a: 'gate', b: 'entry', width: 6 },
      { a: 'entry', b: 'center', width: 9 },
      { a: 'center', b: 'school', width: 5 },
      { a: 'center', b: 'left', width: 9 },
      { a: 'center', b: 'right', width: 9 },
    ],
    areas: [{ minX: 15, maxX: 87, minZ: 54, maxZ: 82 }],
    portals: [{ node: 'gate', to: 'shops', spawn: { x: 14, z: 59 }, label: '상점가로' }],
  },
  shops: {
    image: '/art/shops-game.webp',
    name: '소소한 여름 상점가',
    nodes: [
      { id: 'villagegate', x: 50, z: 36 },
      { id: 'entry', x: 50, z: 46 },
      { id: 'shops', x: 50, z: 65 },
      { id: 'bottom', x: 50, z: 92 },
      { id: 'left', x: 24, z: 60 },
      { id: 'schoolgate', x: 4, z: 56 },
      { id: 'right', x: 88, z: 63 },
    ],
    routes: [
      { a: 'villagegate', b: 'entry', width: 4 },
      { a: 'entry', b: 'shops', width: 6 },
      { a: 'shops', b: 'bottom', width: 10 },
      { a: 'shops', b: 'left', width: 5 },
      { a: 'left', b: 'schoolgate', width: 4 },
      { a: 'shops', b: 'right', width: 5 },
    ],
    portals: [
      { node: 'villagegate', to: 'village', spawn: { x: 50, z: 84 }, label: '논길로' },
      { node: 'schoolgate', to: 'school', spawn: { x: 50, z: 86 }, label: '학교로' },
    ],
  },
};
/** Find the next neighboring scene along a connected region route. */
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
export function distanceToSegment(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}
// Resolve endpoints once; collision is queried repeatedly for every movement substep.
const collisionLanes = Object.fromEntries(
  Object.entries(WORLDS).map(([region, world]) => [
    region,
    world.routes.map((route) => {
      const a = world.nodes.find((node) => node.id === route.a)!;
      const b = world.nodes.find((node) => node.id === route.b)!;
      const dx = b.x - a.x,
        dz = b.z - a.z;
      return { x: a.x, z: a.z, dx, dz, lengthSquared: dx * dx + dz * dz || 1, radiusSquared: route.width ** 2 };
    }),
  ]),
) as Record<Region, { x: number; z: number; dx: number; dz: number; lengthSquared: number; radiusSquared: number }[]>;

export function canWalk(x: number, z: number, region: Region = 'village') {
  if (x < 3 || x > 97 || z < 30 || z > 98) return false;
  if (WORLDS[region].areas?.some((a) => x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ)) return true;
  return collisionLanes[region].some((lane) => {
    const px = x - lane.x,
      pz = z - lane.z;
    const t = Math.max(0, Math.min(1, (px * lane.dx + pz * lane.dz) / lane.lengthSquared));
    return (px - t * lane.dx) ** 2 + (pz - t * lane.dz) ** 2 <= lane.radiusSquared;
  });
}
export function movePlayer(position: Point, dx: number, dz: number, region: Region = 'village') {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.3));
  const next = { ...position };
  for (let i = 0; i < steps; i++) {
    const x = next.x + dx / steps,
      z = next.z + dz / steps;
    if (canWalk(x, z, region)) {
      next.x = x;
      next.z = z;
    } else {
      if (canWalk(x, next.z, region)) next.x = x;
      if (canWalk(next.x, z, region)) next.z = z;
    }
  }
  return next;
}
export function closestLandmark(x: number, z: number, region: Region = 'village') {
  return LANDMARKS.find((p) => p.region === region && Math.hypot(p.x - x, p.z - z) < 3.8) ?? null;
}
/** Shortest connected lane route, used by click-to-walk and the map guide. */
export function findRoute(start: Point, target: Point, region: Region): Point[] {
  const world = WORLDS[region];
  const nearest = (p: Point) =>
    world.nodes.reduce((a, b) => (Math.hypot(a.x - p.x, a.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) ? a : b));
  const from = nearest(start),
    to = nearest(target);
  const costs = new Map<string, number>([[from.id, 0]]),
    previous = new Map<string, string>(),
    unvisited = new Set(world.nodes.map((n) => n.id));
  while (unvisited.size) {
    const current = [...unvisited].sort((a, b) => (costs.get(a) ?? Infinity) - (costs.get(b) ?? Infinity))[0]!;
    if (!Number.isFinite(costs.get(current))) break;
    unvisited.delete(current);
    if (current === to.id) break;
    for (const edge of world.routes.filter((e) => e.a === current || e.b === current)) {
      const other = edge.a === current ? edge.b : edge.a;
      const a = world.nodes.find((n) => n.id === current)!,
        b = world.nodes.find((n) => n.id === other)!;
      const cost = costs.get(current)! + Math.hypot(a.x - b.x, a.z - b.z);
      if (cost < (costs.get(other) ?? Infinity)) {
        costs.set(other, cost);
        previous.set(other, current);
      }
    }
  }
  if (!costs.has(to.id)) return [];
  const ids = [to.id];
  while (ids[0] !== from.id) {
    const prior = previous.get(ids[0]!);
    if (!prior) return [];
    ids.unshift(prior);
  }
  const result: Point[] = ids.map((id) => {
    const n = world.nodes.find((n) => n.id === id)!;
    return { x: n.x, z: n.z };
  });
  if (canWalk(target.x, target.z, region)) result.push(target);
  return result;
}
