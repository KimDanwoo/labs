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

// Returns impact speed only on touchdown. Height is above terrain; world altitude is
// preserved when the ground changes underneath an airborne rider.
export function updateFlight(state: FlightState, input: FlightInput, groundY: number, delta: number): number | null {
  if (!(delta > 0) || !Number.isFinite(delta) || !Number.isFinite(groundY)) return null;
  const wasAirborne = state.height > 0;
  if (wasAirborne && state.groundY !== null) state.height += state.groundY - groundY;
  state.groundY = groundY;
  if (wasAirborne && state.height <= 0) {
    const impact = Math.abs(state.velocity);
    state.height = 0;
    state.velocity = 0;
    return impact;
  }
  if (state.height <= 0) {
    state.height = 0;
    // Takeoff needs a forward run-up and a fresh press; holding lift at rest
    // must not trigger an automatic launch once the rider starts moving.
    const canLaunch = input.launch && input.speed >= FLIGHT.minTakeoffRunSpeed;
    state.velocity = canLaunch ? FLIGHT.takeoffSpeed : 0;
    if (!canLaunch) return null;
  }
  // Small substeps keep apex/flare timing stable at 30, 60 and 120 fps.
  const duration = Math.min(delta, 0.1);
  const steps = Math.ceil(duration * 120);
  const dt = duration / steps;
  for (let i = 0; i < steps; i += 1) {
    const glide = FLIGHT.glideSlow + (FLIGHT.glideFast - FLIGHT.glideSlow) * clamp(Math.abs(input.speed) / 18, 0, 1);
    let target =
      input.lift && !input.descend
        ? FLIGHT.climbSpeed * smooth((FLIGHT.ceiling - state.height) / 4)
        : -(input.descend ? FLIGHT.descendSpeed : glide);
    if (input.holdAltitude) target = Math.max(0, target);
    if (state.height > FLIGHT.ceiling) target = Math.min(target, -Math.min(3, state.height - FLIGHT.ceiling));
    if (target < 0) {
      const flare = smooth(state.height / FLIGHT.flareHeight);
      target = -FLIGHT.landingSpeed + (target + FLIGHT.landingSpeed) * flare;
    }
    let response = 3.2;
    if (input.lift) response = 3.5;
    if (input.descend) response = 4;
    state.velocity += (target - state.velocity) * (1 - Math.exp(-response * dt));
    // Brake before contact even after a fast commanded descent.
    const safeFall = Math.sqrt(FLIGHT.landingSpeed ** 2 + 2 * FLIGHT.flareDeceleration * Math.max(0, state.height));
    state.velocity = Math.max(state.velocity, -safeFall);
    state.height += state.velocity * dt;
    if (state.height <= 0) {
      const impact = Math.abs(state.velocity);
      state.height = 0;
      state.velocity = 0;
      return impact;
    }
  }
  return null;
}
