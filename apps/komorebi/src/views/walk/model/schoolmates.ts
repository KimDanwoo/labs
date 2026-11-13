import { CHARACTER, OUTFIT, type CharacterTemplate, type Outfit } from './world/appearance';
import { canWalk, findRoute, type Point, type Region } from './world/world';

export const SCHOOL_REGION = { yard: 'school', hallway: 'hallway', classroom: 'classroom' } as const;
export type SchoolRegion = (typeof SCHOOL_REGION)[keyof typeof SCHOOL_REGION];
export const SCHOOLMATE_ID = { boy: 'boy', girl: 'girl' } as const;
export type SchoolmateId = (typeof SCHOOLMATE_ID)[keyof typeof SCHOOLMATE_ID];
type Stops = readonly [Point, Point, ...Point[]];
type SchoolmateSpec = {
  id: SchoolmateId;
  name: string;
  character: CharacterTemplate;
  outfit: Outfit;
  speed: number;
  restSeconds: number;
  stops: Record<SchoolRegion, Stops>;
};

export const SCHOOLMATES: readonly SchoolmateSpec[] = [
  {
    id: SCHOOLMATE_ID.boy,
    name: '하루',
    character: CHARACTER.boy,
    outfit: OUTFIT.pe,
    speed: 4,
    restSeconds: 2.4,
    stops: {
      school: [
        { x: 18, z: 72 },
        { x: 34, z: 77 },
        { x: 45, z: 67 },
        { x: 26, z: 66 },
      ],
      hallway: [
        { x: 25, z: 71 },
        { x: 44, z: 74 },
        { x: 54, z: 77 },
        { x: 33, z: 73 },
      ],
      classroom: [
        { x: 50, z: 78 },
        { x: 50, z: 90 },
        { x: 50, z: 84 },
        { x: 50, z: 70 },
      ],
    },
  },
  {
    id: SCHOOLMATE_ID.girl,
    name: '소라',
    character: CHARACTER.girl,
    outfit: OUTFIT.summer,
    speed: 3.5,
    restSeconds: 3.1,
    stops: {
      school: [
        { x: 83, z: 72 },
        { x: 68, z: 75 },
        { x: 58, z: 69 },
        { x: 76, z: 64 },
      ],
      hallway: [
        { x: 69, z: 71 },
        { x: 88, z: 72 },
        { x: 80, z: 80 },
        { x: 63, z: 75 },
      ],
      classroom: [
        { x: 64, z: 62 },
        { x: 74, z: 62 },
        { x: 79, z: 60 },
        { x: 64, z: 60 },
      ],
    },
  },
];

export type Schoolmate = {
  position: Point;
  path: readonly Point[];
  nextStop: number;
  wait: number;
  heading: number;
  travel: number;
  speed: number;
};
const MAX_STEP_SECONDS = 0.05;
const ARRIVAL_DISTANCE = 0.001;
const PERSONAL_SPACE = 2.5;
const WALK_ACCELERATION = 12;
const SLOWDOWN_DISTANCE = 2.4;
const MIN_APPROACH_SPEED = 0.3;
const REST_VARIATION = [1, 1.6, 0.7, 1.25] as const;
export const GREETING_DISTANCE = 5.5;
const GREETING_SPACE = 4.7;
const BALL_PLAY_DISTANCE = 14;

export function schoolmatePlayPosition({ player, friend }: { player: Point; friend: Point }): Point | null {
  const distance = Math.abs(player.x - friend.x);
  if (distance >= 12 && distance <= 18 && Math.abs(player.z - friend.z) < 2) return player;
  const side = player.x < friend.x ? -1 : 1;
  return (
    [side, -side]
      .map((direction) => ({ x: friend.x + direction * BALL_PLAY_DISTANCE, z: friend.z }))
      .find(
        (point) =>
          canWalk(point.x, point.z, SCHOOL_REGION.yard) && findRoute(player, point, SCHOOL_REGION.yard).length > 0,
      ) ?? null
  );
}

export function schoolmateGreetingPosition({
  player,
  friend,
  region,
}: {
  player: Point;
  friend: Point;
  region: Region;
}): Point | null {
  const dx = player.x - friend.x;
  const dz = player.z - friend.z;
  const distance = Math.hypot(dx, dz);
  if (distance >= GREETING_SPACE) return player;
  const directions = [
    { x: distance ? dx / distance : 1, z: distance ? dz / distance : 0 },
    { x: 1, z: 0 },
    { x: -1, z: 0 },
    { x: 0, z: 1 },
    { x: 0, z: -1 },
  ];
  return (
    directions
      .map((direction) => ({ x: friend.x + direction.x * GREETING_SPACE, z: friend.z + direction.z * GREETING_SPACE }))
      .find((point) => canWalk(point.x, point.z, region) && findRoute(player, point, region).length > 0) ?? null
  );
}

export function nearestSchoolmate(
  standing: readonly (Point & { id: SchoolmateId })[],
  player: Point,
): SchoolmateId | null {
  let nearest: SchoolmateId | null = null;
  let distance = GREETING_DISTANCE;
  for (const friend of standing) {
    const nextDistance = Math.hypot(friend.x - player.x, friend.z - player.z);
    if (nextDistance >= distance) continue;
    nearest = friend.id;
    distance = nextDistance;
  }
  return nearest;
}

export function schoolRegion(region: Region): SchoolRegion | null {
  return Object.values(SCHOOL_REGION).find((value) => value === region) ?? null;
}

export function createSchoolmate(spec: SchoolmateSpec, region: SchoolRegion): Schoolmate {
  const [position, destination] = spec.stops[region];
  return {
    position: { ...position },
    path: findRoute(position, destination, region),
    nextStop: 1,
    wait: spec.restSeconds,
    heading: Math.atan2(destination.x - position.x, destination.z - position.z),
    travel: 0,
    speed: 0,
  };
}

export function advanceSchoolmate(
  state: Schoolmate,
  options: { spec: SchoolmateSpec; region: SchoolRegion; dt: number; isStill: boolean; player: Point },
): Schoolmate {
  const { spec, region, isStill, player } = options;
  const dt = Math.max(0, Math.min(MAX_STEP_SECONDS, options.dt));
  const resting = { ...state, travel: 0, speed: 0 };
  if (!dt || isStill) return resting;
  if (state.wait > 0) return { ...resting, wait: Math.max(0, state.wait - dt) };
  const path = state.path.filter(
    (point, index) =>
      index > 0 || Math.hypot(point.x - state.position.x, point.z - state.position.z) > ARRIVAL_DISTANCE,
  );
  const target = path[0];
  if (!target) {
    const stops = spec.stops[region];
    const nextStop = (state.nextStop + 1) % stops.length;
    const destination = stops[nextStop];
    return {
      ...resting,
      nextStop,
      path: destination ? findRoute(state.position, destination, region) : [],
      wait: spec.restSeconds * (REST_VARIATION[state.nextStop % REST_VARIATION.length] ?? 1),
    };
  }
  const dx = target.x - state.position.x;
  const dz = target.z - state.position.z;
  const distance = Math.hypot(dx, dz);
  const perspective = Math.min(1, Math.max(0.45, (state.position.z - 15) / 70));
  const destination = path.at(-1) ?? target;
  const distanceToStop = Math.hypot(destination.x - state.position.x, destination.z - state.position.z);
  const approach = Math.max(MIN_APPROACH_SPEED, Math.min(1, distanceToStop / SLOWDOWN_DISTANCE));
  const speed = Math.min(state.speed + WALK_ACCELERATION * dt, spec.speed * approach);
  const travel = Math.min(distance, speed * perspective * dt);
  const position = { x: state.position.x + (dx / distance) * travel, z: state.position.z + (dz / distance) * travel };
  const playerDistance = Math.hypot(position.x - player.x, position.z - player.z);
  const isApproachingPlayer = playerDistance < Math.hypot(state.position.x - player.x, state.position.z - player.z);
  if (playerDistance < PERSONAL_SPACE && isApproachingPlayer) return resting;
  return { ...state, path, position, heading: Math.atan2(dx, dz), travel: travel / perspective, speed };
}
