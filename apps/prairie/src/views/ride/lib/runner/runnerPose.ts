import { gaitWeights } from '@views/ride/lib/runner/gaitWeights';
import { position } from '@views/ride/lib/runner/runner';
import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { RUNNER_ANIM, RUNNER_ANIM_TUNING } from '@views/ride/model/runner/constants';
import { MathUtils, type AnimationAction, type Group } from 'three';

export interface Gaits {
  idle: AnimationAction | null;
  walk: AnimationAction | null;
  run: AnimationAction | null;
  flight: AnimationAction | null;
}

export interface ReadyGaits {
  idle: AnimationAction;
  walk: AnimationAction;
  run: AnimationAction;
  flight: AnimationAction;
}

export interface PoseMemory {
  heading: number;
  previousSpeed: number;
  acceleration: number;
}

const MAX_FRAME_DELTA = 0.05;
const MIN_DELTA = 0.001;
const GAIT_NAMES = ['idle', 'walk', 'run', 'flight'] as const;
const FLIGHT_HOLD_RATIO = 0.52;
const AIRBORNE_RUN_SCALE = 0.8;
const AIRBORNE_THRESHOLD = 0.5;
const WALK_SCALE_RANGE = [0.45, 1.7] as const;
const ACCELERATION_LIMIT = 14;
const ACCELERATION_DAMP = 5;
const LEAN_GAIN = 0.009;
const LEAN_LIMIT = 0.24;
const LEAN_DAMP = 6;
const PITCH_DAMP = 5;
const LANDING_WINDOW = 0.5;
const LANDING_DECAY = 5;
const LANDING_IMPACT_RANGE = [0.3, 1] as const;
const LANDING_IMPACT_DIVISOR = 3;
const GALLOP_BOUNCE = 0.035;
const LANDING_DIP = 0.12;
const SLOPE_PROBE = 1.2;
const SLOPE_SPAN = 2.4;
const ACCELERATION_PITCH = 0.003;
const GALLOP_PITCH = 0.025;
const CLIMB_PITCH = 0.018;
const LANDING_PITCH = 0.06;

export function startGaits(actions: Record<string, AnimationAction | null>): Gaits {
  const gaits = {
    idle: actions[RUNNER_ANIM.idle] ?? null,
    walk: actions[RUNNER_ANIM.walk] ?? null,
    run: actions[RUNNER_ANIM.run] ?? null,
    flight: actions[RUNNER_ANIM.flight] ?? null,
  };
  Object.values(gaits).forEach((action) => {
    action?.reset().play();
    if (action) action.weight = 0;
  });
  if (gaits.idle) gaits.idle.weight = 1;
  if (gaits.flight) {
    gaits.flight.time = gaits.flight.getClip().duration * FLIGHT_HOLD_RATIO;
    gaits.flight.paused = true;
  }
  return gaits;
}

export function stopGaits(gaits: Gaits): void {
  Object.values(gaits).forEach((action) => action?.stop());
}

export function readyGaits(gaits: Gaits): ReadyGaits | null {
  const { idle, walk, run, flight } = gaits;
  if (!idle) return null;
  if (!walk) return null;
  if (!run) return null;
  if (!flight) return null;
  return { idle, walk, run, flight };
}

function retimeGaits(gaits: ReadyGaits, speed: number, signedSpeed: number, airborne: number, delta: number): void {
  const tune = RUNNER_ANIM_TUNING;
  const weights = gaitWeights(speed, runnerState.airborneHeight, tune.gallopBlendStart, tune.gallopBlendEnd);
  for (const name of GAIT_NAMES) {
    const action = gaits[name];
    action.weight = MathUtils.damp(action.weight, weights[name], tune.blendRate, delta);
  }
  const walkScale = MathUtils.clamp(speed / tune.walkRefSpeed, WALK_SCALE_RANGE[0], WALK_SCALE_RANGE[1]);
  gaits.walk.timeScale = (signedSpeed < 0 ? -1 : 1) * walkScale;
  const minRunScale = airborne > AIRBORNE_THRESHOLD ? AIRBORNE_RUN_SCALE : tune.minRunScale;
  gaits.run.timeScale = MathUtils.clamp(speed / tune.runRefSpeed, minRunScale, tune.maxRunScale);
}

function trackAcceleration(memory: PoseMemory, signedSpeed: number, delta: number): void {
  const acceleration = (signedSpeed - memory.previousSpeed) / Math.max(delta, MIN_DELTA);
  const limited = MathUtils.clamp(acceleration, -ACCELERATION_LIMIT, ACCELERATION_LIMIT);
  memory.acceleration = MathUtils.damp(memory.acceleration, limited, ACCELERATION_DAMP, delta);
  memory.previousSpeed = signedSpeed;
}

function landingBounce(elapsed: number): number {
  const landingAge = elapsed - runnerState.landedAt;
  if (runnerState.landedAt < 0) return 0;
  if (landingAge < 0) return 0;
  if (landingAge >= LANDING_WINDOW) return 0;
  const impact = MathUtils.clamp(
    runnerState.landingImpact / LANDING_IMPACT_DIVISOR,
    LANDING_IMPACT_RANGE[0],
    LANDING_IMPACT_RANGE[1],
  );
  return Math.sin((landingAge / LANDING_WINDOW) * Math.PI) * Math.exp(-landingAge * LANDING_DECAY) * impact;
}

function groundSlope(): number {
  const { x, z } = runnerState.position;
  const dx = Math.sin(runnerState.heading) * SLOPE_PROBE;
  const dz = Math.cos(runnerState.heading) * SLOPE_PROBE;
  return Math.atan2(terrainHeightAt(x + dx, z + dz) - terrainHeightAt(x - dx, z - dz), SLOPE_SPAN);
}

function poseBody(root: Group, run: AnimationAction, memory: PoseMemory, speed: number, ctx: PoseContext): void {
  const { elapsed, delta, airborne } = ctx;
  const turn = MathUtils.euclideanModulo(runnerState.heading - memory.heading + Math.PI, Math.PI * 2) - Math.PI;
  const lean = MathUtils.clamp((turn / Math.max(delta, MIN_DELTA)) * speed * LEAN_GAIN, -LEAN_LIMIT, LEAN_LIMIT);
  root.rotation.z = MathUtils.damp(root.rotation.z, lean, LEAN_DAMP, delta);
  const phase = (run.time / run.getClip().duration) * Math.PI * 2;
  const gallop = run.weight * (1 - airborne);
  const landing = landingBounce(elapsed);
  root.position.y = position[1] + (1 - Math.cos(phase * 2)) * GALLOP_BOUNCE * gallop - landing * LANDING_DIP;
  const pitch =
    -groundSlope() * (1 - airborne) +
    memory.acceleration * ACCELERATION_PITCH * (1 - airborne) +
    Math.sin(phase) * GALLOP_PITCH * gallop -
    runnerState.verticalSpeed * CLIMB_PITCH * airborne +
    landing * LANDING_PITCH;
  root.rotation.x = MathUtils.damp(root.rotation.x, pitch, PITCH_DAMP, delta);
}

interface PoseContext {
  elapsed: number;
  delta: number;
  airborne: number;
}

export function updateRunnerPose(
  root: Group | null,
  gaits: Gaits,
  memory: PoseMemory,
  signedSpeed: number,
  elapsed: number,
  rawDelta: number,
): void {
  const ready = readyGaits(gaits);
  if (!ready) return;
  const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
  const speed = Math.abs(signedSpeed);
  const { airborne } = gaitWeights(
    speed,
    runnerState.airborneHeight,
    RUNNER_ANIM_TUNING.gallopBlendStart,
    RUNNER_ANIM_TUNING.gallopBlendEnd,
  );
  retimeGaits(ready, speed, signedSpeed, airborne, delta);
  trackAcceleration(memory, signedSpeed, delta);
  if (root) poseBody(root, ready.run, memory, speed, { elapsed, delta, airborne });
  memory.heading = runnerState.heading;
}
