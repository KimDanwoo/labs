export const FLIGHT = {
  ceiling: 32,
  minTakeoffRunSpeed: 7,
  takeoffSpeed: 5.6,
  climbSpeed: 5.5,
  glideSlow: 6.5,
  glideFast: 4.5,
  descendSpeed: 10,
  flareHeight: 1.6,
  landingSpeed: 1,
  flareDeceleration: 12,
} as const;

export type FlightState = {
  height: number;
  velocity: number;
  groundY: number | null;
};
export type FlightInput = {
  lift: boolean;
  launch: boolean;
  descend: boolean;
  holdAltitude: boolean;
  speed: number;
};
export const createFlightState = (): FlightState => ({ height: 0, velocity: 0, groundY: null });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (v: number) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

function touchDown(state: FlightState): number {
  const impact = Math.abs(state.velocity);
  state.height = 0;
  state.velocity = 0;
  return impact;
}

function beginLaunch(state: FlightState, input: FlightInput): boolean {
  state.height = 0;
  const canLaunch = input.launch && input.speed >= FLIGHT.minTakeoffRunSpeed;
  state.velocity = canLaunch ? FLIGHT.takeoffSpeed : 0;
  return canLaunch;
}

function targetVelocity(state: FlightState, input: FlightInput): number {
  const glide = FLIGHT.glideSlow + (FLIGHT.glideFast - FLIGHT.glideSlow) * clamp(Math.abs(input.speed) / 18, 0, 1);
  const shouldClimb = input.lift && !input.descend;
  let target = shouldClimb
    ? FLIGHT.climbSpeed * smooth((FLIGHT.ceiling - state.height) / 4)
    : -(input.descend ? FLIGHT.descendSpeed : glide);
  if (input.holdAltitude) target = Math.max(0, target);
  if (state.height > FLIGHT.ceiling) target = Math.min(target, -Math.min(3, state.height - FLIGHT.ceiling));
  if (target < 0) {
    const flare = smooth(state.height / FLIGHT.flareHeight);
    target = -FLIGHT.landingSpeed + (target + FLIGHT.landingSpeed) * flare;
  }
  return target;
}

function responseRate(input: FlightInput): number {
  if (input.descend) return 4;
  return input.lift ? 3.5 : 3.2;
}

function integrateFlight(state: FlightState, input: FlightInput, delta: number): number | null {
  const duration = Math.min(delta, 0.1);
  const steps = Math.ceil(duration * 120);
  const dt = duration / steps;
  for (let i = 0; i < steps; i += 1) {
    const target = targetVelocity(state, input);
    state.velocity += (target - state.velocity) * (1 - Math.exp(-responseRate(input) * dt));
    const safeFall = Math.sqrt(FLIGHT.landingSpeed ** 2 + 2 * FLIGHT.flareDeceleration * Math.max(0, state.height));
    state.velocity = Math.max(state.velocity, -safeFall);
    state.height += state.velocity * dt;
    if (state.height <= 0) return touchDown(state);
  }
  return null;
}

export function updateFlight(state: FlightState, input: FlightInput, groundY: number, delta: number): number | null {
  if (!(delta > 0)) return null;
  if (!Number.isFinite(delta)) return null;
  if (!Number.isFinite(groundY)) return null;
  const wasAirborne = state.height > 0;
  const { groundY: previousGroundY } = state;
  const shouldCarryHeight = wasAirborne && previousGroundY !== null;
  if (shouldCarryHeight) state.height += previousGroundY - groundY;
  state.groundY = groundY;
  const hasLanded = wasAirborne && state.height <= 0;
  if (hasLanded) return touchDown(state);
  const isGroundedWithoutLaunch = state.height <= 0 && !beginLaunch(state, input);
  if (isGroundedWithoutLaunch) return null;
  return integrateFlight(state, input, delta);
}
