import { hasGroundBetween, isOnGround } from './ground';

export type Region = 'village' | 'river' | 'coast' | 'forest' | 'school' | 'shops' | 'home';
export type Point = { x: number; z: number };
export type RouteNode = Point & { id: string };
export type Route = { a: string; b: string; width: number };
export const SPAWN: Point = { x: 50, z: 82 };
export const HOME = {
  id: 'home',
  region: 'home',
  name: '파란 지붕 우리 집',
  short: '우리 집',
  icon: '⌂',
  x: 36,
  z: 70,
} as const;
export const HOME_DOOR = { x: 15, z: 38 };
export const HOME_BED = { name: '포근한 잠자리', x: 70, z: 76 };
/** A small thing to do at each place once its memory for this time of day is kept. */
export const PLACE_ACTION = {
  gust: 'gust',
  skip: 'skip',
  shell: 'shell',
  bell: 'bell',
  schoolBell: 'schoolBell',
  windChime: 'windChime',
} as const;
export type PlaceAction = (typeof PLACE_ACTION)[keyof typeof PLACE_ACTION];
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
    eveningText: '노을이 논물 위에 길게 눕는다. 개구리 소리가 하나둘 켜지고, 그림자가 나보다 먼저 집으로 걸어간다.',
    nightText: '논물에 별이 하나씩 내려앉는다. 개구리들이 저마다 목청을 높이고, 먼 집 창문에 저녁 불빛이 켜져 있다.',
    action: { kind: PLACE_ACTION.gust, label: '바람 불어 보기', caption: '바람이 논을 한 줄로 쓸고 지나간다.' },
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
    eveningText: '해 질 녘의 강은 귤빛으로 물든다. 난간에 기대어 있으니 물소리가 낮보다 조금 더 크게 들린다.',
    nightText: '어두운 다리 위에서 물소리만 또렷하다. 반딧불 몇 마리가 강을 건너, 나보다 먼저 저편에 닿는다.',
    action: { kind: PLACE_ACTION.skip, label: '물수제비 뜨기', caption: '퐁, 퐁, 퐁 — 돌이 세 번 튀었다!' },
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
    eveningText: '수평선 끝으로 해가 천천히 잠긴다. 마지막 배가 항구로 돌아오는 걸 보고 나서야 발걸음을 돌린다.',
    nightText: '항구의 등불이 물 위에 길게 흔들린다. 파도 소리가 낮보다 가까워서, 바다가 숨 쉬는 게 들리는 것 같다.',
    action: { kind: PLACE_ACTION.shell, label: '조개 줍기', caption: '반짝이는 조개 하나를 주웠다.' },
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
    eveningText: '숲이 먼저 어두워진다. 돌계단 위로 반딧불 하나가 떠오르고, 낮에 맡긴 소원이 아직 거기 있는 것 같다.',
    nightText: '석등에 작은 불이 들어와 있다. 숲은 깜깜한데 무섭지 않다. 반딧불이 길을 비춰 주는 것 같아서.',
    action: { kind: PLACE_ACTION.bell, label: '방울 울리기', caption: '딸랑 — 방울 소리가 숲에 번진다.' },
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
    eveningText: '운동장 시계가 여섯 시를 가리킨다. 철봉 그림자가 길어지고, 어디선가 저녁밥 냄새가 담장을 넘어온다.',
    nightText: '아무도 없는 밤의 운동장에 달빛이 하얗게 깔린다. 교실 창문에 비친 내 모습이 꼭 다른 학교 아이 같다.',
    action: {
      kind: PLACE_ACTION.schoolBell,
      label: '학교 종 치기',
      caption: '딩동댕 — 아무도 없는 운동장에 종이 울린다.',
    },
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
    eveningText: '가게마다 하나둘 불이 켜진다. 문 닫기 전 마지막 아이스크림을 사서, 녹기 전에 집까지 뛰어가기로 한다.',
    nightText: '셔터가 내려간 골목에 자판기 불빛만 남았다. 동전 하나로 산 라무네가 차가워서, 여름이 손바닥에 담긴다.',
    action: { kind: PLACE_ACTION.windChime, label: '풍경 울리기', caption: '처마 끝 풍경이 짤랑짤랑 흔들린다.' },
  },
] as const;
export type Landmark = (typeof LANDMARKS)[number];
export const DESTINATIONS = [...LANDMARKS, HOME];
export const WORLDS: Record<
  Region,
  {
    image: string;
    name: string;
    nodes: RouteNode[];
    routes: Route[];
    portals: { node: string; to: Region; spawn: Point; label: string }[];
  }
> = {
  home: {
    image: '/art/home-interior-scaled-roof.webp',
    name: '파란 지붕 우리 집',
    nodes: [
      { id: 'door', x: 23.5, z: 65 },
      { id: 'entry', x: 30, z: 66 },
      { id: 'home', x: HOME.x, z: HOME.z },
      { id: 'middle', x: 51, z: 77 },
      { id: 'bed', x: HOME_BED.x, z: HOME_BED.z },
      { id: 'window', x: 54, z: 59 },
      { id: 'desk', x: 40, z: 57 },
      { id: 'front', x: 53, z: 91 },
    ],
    routes: [
      { a: 'door', b: 'entry', width: 3 },
      { a: 'entry', b: 'home', width: 4 },
      { a: 'home', b: 'middle', width: 5 },
      { a: 'middle', b: 'bed', width: 4 },
      { a: 'middle', b: 'window', width: 4 },
      { a: 'window', b: 'desk', width: 3 },
      { a: 'middle', b: 'front', width: 5 },
    ],
    portals: [{ node: 'door', to: 'village', spawn: { x: 17, z: 41 }, label: '마을' }],
  },
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
      { id: HOME.id, x: HOME_DOOR.x, z: HOME_DOOR.z },
      { id: 'forestgate', x: 4, z: 36 },
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
      { a: 'house', b: HOME.id, width: 1.2 },
      { a: 'fork', b: 'fields', width: 3 },
      { a: 'fields', b: 'bridge', width: 1.2 },
      // Narrow diagonal deck, measured between the painted railings.
      { a: 'bridge', b: 'rivergate', width: 0.65 },
    ],
    portals: [
      { node: HOME.id, to: 'home', spawn: { x: 30, z: 66 }, label: '우리 집' },
      { node: 'bottom', to: 'shops', spawn: { x: 50, z: 46 }, label: '상점가' },
      { node: 'forestgate', to: 'forest', spawn: { x: 50, z: 88 }, label: '산길' },
      { node: 'rivergate', to: 'river', spawn: { x: 12, z: 48 }, label: '강가' },
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
      { id: 'pathmouth', x: 23, z: 53 },
      { id: 'pathbend', x: 23, z: 68 },
      { id: 'picnic', x: 17, z: 88 },
    ],
    routes: [
      { a: 'back', b: 'entry', width: 3 },
      { a: 'entry', b: 'bank', width: 3 },
      { a: 'bank', b: 'river', width: 1.1 },
      { a: 'river', b: 'east', width: 1.1 },
      { a: 'east', b: 'coastgate', width: 3 },
      { a: 'bank', b: 'pathmouth', width: 2 },
      { a: 'pathmouth', b: 'pathbend', width: 3.7 },
      { a: 'pathbend', b: 'picnic', width: 3.8 },
    ],
    portals: [
      { node: 'back', to: 'village', spawn: { x: 84, z: 42.33 }, label: '마을' },
      { node: 'coastgate', to: 'coast', spawn: { x: 12, z: 62 }, label: '바다' },
    ],
  },
  coast: {
    image: '/art/coast-harbour-road.webp',
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
    portals: [{ node: 'back', to: 'river', spawn: { x: 85, z: 47 }, label: '강가' }],
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
    portals: [{ node: 'back', to: 'village', spawn: { x: 16, z: 41 }, label: '마을' }],
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
    portals: [{ node: 'gate', to: 'shops', spawn: { x: 14, z: 60 }, label: '상점가' }],
  },
  shops: {
    image: '/art/shops-school-road.webp',
    name: '소소한 여름 상점가',
    nodes: [
      { id: 'villagegate', x: 50, z: 36 },
      { id: 'entry', x: 50, z: 46 },
      { id: 'shops', x: 50, z: 65 },
      { id: 'bottom', x: 50, z: 92 },
      { id: 'left', x: 24, z: 60 },
      { id: 'schoolgate', x: 4, z: 59 },
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
      { node: 'villagegate', to: 'village', spawn: { x: 50, z: 84 }, label: '논길' },
      { node: 'schoolgate', to: 'school', spawn: { x: 50, z: 86 }, label: '학교' },
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
/** Ground outlines define movement; guide routes never restrict where the player can stand. */
export function canWalk(x: number, z: number, region: Region = 'village') {
  return (
    Number.isFinite(x) && Number.isFinite(z) && x >= 0 && x <= 100 && z >= 0 && z <= 100 && isOnGround(x, z, region)
  );
}
export type SlideMotion = { direction: Point | null; input: Point | null };
export function createSlideMotion(): SlideMotion {
  return { direction: null, input: null };
}

/** Follow a nearby free direction when the requested step meets a road edge. */
function slideStep(position: Point, dx: number, dz: number, region: Region, slide?: SlideMotion): Point {
  const length = Math.hypot(dx, dz);
  if (length < 1e-9) return position;
  let best = position;
  let bestScore = -Infinity;
  for (const degrees of [15, 30, 45, 60, 75, 90]) {
    for (const side of [-1, 1]) {
      const angle = (side * degrees * Math.PI) / 180;
      const sx = dx * Math.cos(angle) - dz * Math.sin(angle);
      const sz = dx * Math.sin(angle) + dz * Math.cos(angle);
      const candidate = { x: position.x + sx, z: position.z + sz };
      if (!clearSegment(position, candidate, region)) continue;
      // Prefer a direction with room ahead, so small edge irregularities do not trap the feet.
      const ahead = { x: position.x + sx / length, z: position.z + sz / length };
      const continuity = slide?.direction ? (sx * slide.direction.x + sz * slide.direction.z) / length : 0;
      if (slide?.direction && continuity < -0.05) continue;
      const score = Math.cos(angle) + (clearSegment(position, ahead, region) ? 0.35 : 0) + continuity * 0.65;
      if (score > bestScore + 1e-6) {
        best = candidate;
        bestScore = score;
      }
    }
  }
  if (slide && best !== position)
    slide.direction = { x: (best.x - position.x) / length, z: (best.z - position.z) / length };
  return best;
}

export function movePlayer(position: Point, dx: number, dz: number, region: Region = 'village', slide?: SlideMotion) {
  if (!Number.isFinite(dx) || !Number.isFinite(dz)) return { ...position };
  const distance = Math.hypot(dx, dz);
  if (slide) {
    if (distance < 1e-9) {
      slide.direction = null;
      slide.input = null;
      return { ...position };
    }
    const input = { x: dx / distance, z: dz / distance };
    if (slide.input && input.x * slide.input.x + input.z * slide.input.z < 0.95) slide.direction = null;
    slide.input = input;
  }
  const steps = Math.max(1, Math.ceil(distance / 0.3));
  let next = { ...position };
  for (let i = 0; i < steps; i++) {
    const candidate = { x: next.x + dx / steps, z: next.z + dz / steps };
    const ahead = {
      x: next.x + (dx / Math.max(distance, 1e-9)) * 0.8,
      z: next.z + (dz / Math.max(distance, 1e-9)) * 0.8,
    };
    if (clearSegment(next, candidate, region) && (!slide?.direction || clearSegment(next, ahead, region))) {
      next = candidate;
      if (slide) slide.direction = null;
    } else {
      next = slideStep(next, dx / steps, dz / steps, region, slide);
    }
  }
  return next;
}
export function closestLandmark(x: number, z: number, region: Region = 'village') {
  return LANDMARKS.find((p) => p.region === region && Math.hypot(p.x - x, p.z - z) < 3.8) ?? null;
}
function clearSegment(from: Point, to: Point, region: Region) {
  return canWalk(from.x, from.z, region) && canWalk(to.x, to.z, region) && hasGroundBetween(from, to, region);
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
/** Route across the full painted ground, using only unobstructed connections. */
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
