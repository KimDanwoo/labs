export type ChildMotion = {
  phase: number;
  energy: number;
  run: number;
  heading: number;
  turn: number;
};
export function createMotion(): ChildMotion {
  return { phase: 0, energy: 0, run: 0, heading: 0, turn: 0 };
}
export function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
/** Travel-driven gait never resets its phase when Shift changes or a frame stalls. */
export function advanceMotion(
  state: ChildMotion,
  dt: number,
  travel: number,
  heading: number,
  running: boolean,
  moving: boolean,
) {
  const blend = 1 - Math.exp(-dt * 13);
  state.energy += ((moving ? 1 : 0) - state.energy) * blend;
  state.run += ((running && moving ? 1 : 0) - state.run) * (1 - Math.exp(-dt * 9));
  state.phase += (travel * Math.PI * 2) / (8 + state.run * 3);
  const delta = angleDelta(state.heading, heading);
  const turn = delta * (1 - Math.exp(-dt * 15));
  state.heading += turn;
  state.turn += (Math.max(-1, Math.min(1, delta)) - state.turn) * blend;
  return state;
}
/** Two-segment leg solver, keeping the sole level during the planted part of a step. */
export function solveLeg(forward: number, lift: number, hipHeight = 1.62) {
  const upper = 0.72,
    lower = 0.73;
  const down = hipHeight - 0.24 - lift;
  const distance = Math.min(upper + lower - 0.001, Math.hypot(down, forward));
  const knee = Math.acos(
    Math.max(-1, Math.min(1, (distance * distance - upper * upper - lower * lower) / (2 * upper * lower))),
  );
  const hip = Math.atan2(-forward, down) - Math.atan2(lower * Math.sin(knee), upper + lower * Math.cos(knee));
  return { hip, knee, ankle: -hip - knee };
}

/** A gait cycle plants two feet: one each time the phase passes a multiple of π. */
export function crossedFootfall(previousPhase: number, nextPhase: number) {
  return Math.floor(nextPhase / Math.PI) > Math.floor(previousPhase / Math.PI);
}

export function isAirborne(jump: JumpMotion) {
  return jump.height > 0 || jump.velocity > 0;
}

export type JumpMotion = { height: number; velocity: number; landing: number };
export function createJump(): JumpMotion {
  return { height: 0, velocity: 0, landing: 0 };
}
export function startJump(jump: JumpMotion) {
  if (jump.height > 0 || jump.velocity > 0) return false;
  jump.velocity = 8;
  jump.landing = 0;
  return true;
}
export function advanceJump(jump: JumpMotion, dt: number) {
  jump.landing *= Math.exp(-dt * 12);
  if (jump.height > 0 || jump.velocity > 0) {
    jump.height += jump.velocity * dt - 20 * dt * dt;
    jump.velocity -= 40 * dt;
    if (jump.height <= 0 && jump.velocity < 0) {
      jump.height = 0;
      jump.velocity = 0;
      jump.landing = 1;
    }
  }
  return jump;
}

/** Linear stance cancels world travel; eased recovery lifts the toe off the ground. */
export function footCycle(phase: number, run: number) {
  const t = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
  const stance = 0.6 - run * 0.22;
  if (t < stance) return { along: 0.5 - t / stance, lift: 0, planted: true };
  const u = (t - stance) / (1 - stance);
  return { along: -0.5 + u * u * (3 - 2 * u), lift: Math.sin(Math.PI * u), planted: false };
}
