/** Insect flight in painting percent (x across, z down). Pure state machines so the rules can be tested. */

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
type Random = () => number;

export const FLIGHT = { flutter: 'flutter', rest: 'rest', hover: 'hover', dart: 'dart' } as const;
type Mode = (typeof FLIGHT)[keyof typeof FLIGHT];

export type Flight = {
  x: number;
  z: number;
  heading: number;
  speed: number;
  mode: Mode;
  timer: number;
  targetX: number;
  targetZ: number;
  /** Wing phase in radians; its rate depends on what the insect is doing. */
  wing: number;
};

const between = (random: Random, min: number, max: number) => min + random() * (max - min);
const inside = (b: Bounds, x: number, z: number) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

export function startFlight(bounds: Bounds, random: Random, mode: Mode): Flight {
  const x = between(random, bounds.minX, bounds.maxX);
  const z = between(random, bounds.minZ, bounds.maxZ);
  return {
    x,
    z,
    heading: random() * Math.PI * 2,
    speed: 0,
    mode,
    timer: between(random, 0.5, 3),
    targetX: x,
    targetZ: z,
    wing: random() * 6,
  };
}

const BUTTERFLY = { minSpeed: 2.5, maxSpeed: 5.5, turn: 5, flap: 14, restFlap: 2.2, restChance: 0.3 };

/** Wanders with jittery turns, drifts back when it strays, and now and then settles to open and close its wings. */
export function stepButterfly(f: Flight, dt: number, bounds: Bounds, random: Random): Flight {
  if (f.mode === FLIGHT.rest) {
    const timer = f.timer - dt;
    if (timer > 0) return { ...f, timer, speed: 0, wing: f.wing + dt * BUTTERFLY.restFlap };
    return { ...f, mode: FLIGHT.flutter, timer: between(random, 2, 6), speed: BUTTERFLY.minSpeed };
  }
  const centreX = (bounds.minX + bounds.maxX) / 2;
  const centreZ = (bounds.minZ + bounds.maxZ) / 2;
  const homeward = Math.atan2(centreZ - f.z, centreX - f.x);
  const drift = (random() - 0.5) * BUTTERFLY.turn * dt * 2;
  const pull = inside(bounds, f.x, f.z) ? 0 : angleTowards(f.heading, homeward) * Math.min(1, dt * 3);
  const heading = f.heading + drift + pull;
  const speed = Math.min(BUTTERFLY.maxSpeed, Math.max(BUTTERFLY.minSpeed, f.speed + (random() - 0.5) * 8 * dt));
  const next = {
    ...f,
    heading,
    speed,
    x: f.x + Math.cos(heading) * speed * dt,
    z: f.z + Math.sin(heading) * speed * dt * 0.6,
    wing: f.wing + dt * BUTTERFLY.flap,
    timer: f.timer - dt,
  };
  if (next.timer > 0) return next;
  if (random() < BUTTERFLY.restChance && inside(bounds, next.x, next.z))
    return { ...next, mode: FLIGHT.rest, timer: between(random, 1.5, 4.5) };
  return { ...next, timer: between(random, 2, 6) };
}

const DRAGONFLY = { dartSpeed: 22, flap: 45, perchChance: 0.15 };

/** Hovers in place with small jitters, then darts straight to a new spot; sometimes perches for a while. */
export function stepDragonfly(f: Flight, dt: number, bounds: Bounds, random: Random): Flight {
  if (f.mode === FLIGHT.dart) {
    const dx = f.targetX - f.x;
    const dz = f.targetZ - f.z;
    const distance = Math.hypot(dx, dz);
    const travel = DRAGONFLY.dartSpeed * dt;
    if (distance <= travel)
      return {
        ...f,
        x: f.targetX,
        z: f.targetZ,
        mode: FLIGHT.hover,
        timer: between(random, 0.4, 2.4),
        wing: f.wing + dt * DRAGONFLY.flap,
      };
    return {
      ...f,
      x: f.x + (dx / distance) * travel,
      z: f.z + (dz / distance) * travel,
      heading: Math.atan2(dz, dx),
      wing: f.wing + dt * DRAGONFLY.flap,
    };
  }
  const timer = f.timer - dt;
  const isPerched = f.mode === FLIGHT.rest;
  if (timer > 0) {
    const jitter = isPerched ? 0 : 0.35;
    return {
      ...f,
      timer,
      x: f.x + (random() - 0.5) * jitter * dt * 4,
      z: f.z + (random() - 0.5) * jitter * dt * 2,
      wing: f.wing + dt * (isPerched ? 0 : DRAGONFLY.flap),
    };
  }
  if (!isPerched && random() < DRAGONFLY.perchChance) return { ...f, mode: FLIGHT.rest, timer: between(random, 2, 5) };
  const reach = between(random, 4, 14);
  const angle = random() * Math.PI * 2;
  const targetX = Math.min(bounds.maxX, Math.max(bounds.minX, f.x + Math.cos(angle) * reach));
  const targetZ = Math.min(bounds.maxZ, Math.max(bounds.minZ, f.z + Math.sin(angle) * reach * 0.6));
  return { ...f, mode: FLIGHT.dart, targetX, targetZ, heading: Math.atan2(targetZ - f.z, targetX - f.x) };
}

/** Signed smallest turn from one heading to another. */
function angleTowards(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
