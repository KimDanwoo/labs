import { BOAT_DECK } from '@views/drive/lib/engine/game/physics/boatWaters';
import { clamp, lerp } from '@views/drive/lib/engine/game/utilities/maths';

export const FLIGHT_ALTITUDE = { ceiling: 10, takeoff: 3.5, clearance: 2.4, rest: 1.1 } as const;
const CLIMB = { rate: 3.5, gain: 1.2, topSpeed: 3, clearingSpeed: 10 } as const;
const LANDING = { gain: 0.8, minSpeed: 1.2, maxSpeed: 4.5 } as const;
const CRUISE = { speed: 10, reverseRatio: 0.6, boostRatio: 1.7 } as const;
const LEAN = { pitch: 0.3, bank: 0.25 } as const;

interface AltitudeSteer {
  readonly target: number;
  readonly ground: number;
  readonly input: number;
  readonly delta: number;
}

interface Lean {
  readonly pitch: number;
  readonly bank: number;
}

interface Altitude {
  readonly elevation: number;
  readonly ground: number;
}

export function takeoffAltitude(elevation: number): number {
  return Math.min(elevation + FLIGHT_ALTITUDE.takeoff, FLIGHT_ALTITUDE.ceiling);
}

export function steerAltitude({ target, ground, input, delta }: AltitudeSteer): number {
  if (input === 0) return Math.min(target, FLIGHT_ALTITUDE.ceiling);
  const floor = ground + FLIGHT_ALTITUDE.clearance;
  return clamp(Math.max(target, floor) + input * CLIMB.rate * delta, floor, FLIGHT_ALTITUDE.ceiling);
}

export function climbSpeed({ elevation, ground, target }: Altitude & { readonly target: number }): number {
  const floor = ground + FLIGHT_ALTITUDE.clearance;
  const isClearingObstacle = floor > target;
  const rise = isClearingObstacle ? CLIMB.clearingSpeed : CLIMB.topSpeed;
  return clamp((Math.max(target, floor) - elevation) * CLIMB.gain, -CLIMB.topSpeed, rise);
}

export function landingSpeed({ elevation, ground }: Altitude): number {
  const height = Math.max(0, elevation - ground - FLIGHT_ALTITUDE.rest);
  return -clamp(height * LANDING.gain, LANDING.minSpeed, LANDING.maxSpeed);
}

export function hasTouchedDown({ elevation, wheelContacts }: { elevation: number; wheelContacts: number }): boolean {
  const isOnWheels = wheelContacts > 0;
  const isOnWater = elevation < BOAT_DECK.enter;
  return isOnWheels || isOnWater;
}

export function cruiseSpeed(throttle: number, boost: number): number {
  const direction = throttle < 0 ? CRUISE.reverseRatio : 1;
  return throttle * direction * lerp(1, CRUISE.boostRatio, boost) * CRUISE.speed;
}

export function leanAngles(forwardSpeed: number, steering: number): Lean {
  const headway = clamp(forwardSpeed / CRUISE.speed, -1, 1);
  return { pitch: headway * LEAN.pitch, bank: steering * Math.abs(headway) * LEAN.bank };
}
