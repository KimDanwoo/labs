import { MathUtils, type Group, type Object3D, type Vector3 } from 'three';
import { runnerState } from '../../model/ride-state/runnerState';
import { WINGS } from '../../model/runner/constants';

export interface WingRig {
  root: Group;
  left: Group | null;
  right: Group | null;
  leftTrim: Group | null;
  rightTrim: Group | null;
}

export interface WingMemory {
  open: number;
  phase: number;
}

const MAX_FRAME_DELTA = 0.05;
const OPEN_DAMP = 6;
const FALL_RANGE = [0.5, 5] as const;
const LANDING_RANGE = [0.6, 2.4] as const;
const OPEN_RANGE = [0.15, 0.9] as const;
const FALL_CLOSE = 0.65;
const LANDING_FLARE = 0.55;
const RISE_RANGE = [-0.3, 2] as const;
const FLARE_RANGE = [0.4, 3] as const;
const GLIDE_ANGLE = 0.16;
const GLIDE_AMPLITUDE = 0.1;
const FLARE_ANGLE = 0.22;
const FOLD_ROLL = 1.25;

function openTarget(): number {
  const { airborneHeight, verticalSpeed } = runnerState;
  const falling = MathUtils.smoothstep(-verticalSpeed, FALL_RANGE[0], FALL_RANGE[1]);
  const landingFlare = (1 - MathUtils.smoothstep(airborneHeight, LANDING_RANGE[0], LANDING_RANGE[1])) * falling;
  return (
    MathUtils.smoothstep(airborneHeight, OPEN_RANGE[0], OPEN_RANGE[1]) *
    (1 - falling * FALL_CLOSE + landingFlare * LANDING_FLARE)
  );
}

function flapAngle(memory: WingMemory, delta: number): number {
  const { airborneHeight, verticalSpeed } = runnerState;
  const rising = MathUtils.smoothstep(verticalSpeed, RISE_RANGE[0], RISE_RANGE[1]);
  const flare =
    (1 - MathUtils.smoothstep(airborneHeight, FLARE_RANGE[0], FLARE_RANGE[1])) * (verticalSpeed < 0 ? 1 : 0);
  memory.phase += MathUtils.lerp(WINGS.flapSpeedAir, WINGS.flapSpeedRising, rising) * delta;
  return (
    MathUtils.lerp(GLIDE_ANGLE, WINGS.openAngleBase, rising) +
    Math.sin(memory.phase) * MathUtils.lerp(GLIDE_AMPLITUDE, WINGS.flapAmplitude, rising) +
    flare * FLARE_ANGLE
  );
}

function poseWing(wing: Group, side: 1 | -1, angle: number, open: number, size: number): void {
  wing.rotation.z = side * angle;
  wing.rotation.x = (-Math.PI / 2) * (1 - open);
  wing.rotation.y = side * FOLD_ROLL * (1 - open);
  wing.scale.setScalar(size);
}

export function updateMagicWings(
  rig: WingRig,
  anchor: Object3D,
  point: Vector3,
  memory: WingMemory,
  rawDelta: number,
): void {
  const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
  const { root, left, right, leftTrim, rightTrim } = rig;
  anchor.getWorldPosition(point);
  root.parent?.worldToLocal(point);
  root.position.copy(point);
  memory.open = MathUtils.damp(memory.open, openTarget(), OPEN_DAMP, delta);
  const open = memory.open;
  root.visible = true;
  const angle = MathUtils.lerp(WINGS.foldedAngle, flapAngle(memory, delta), open);
  const size = MathUtils.lerp(WINGS.foldedScale, 1, open);
  const isTrimVisible = open > WINGS.trimVisibleOpen;
  if (leftTrim) leftTrim.visible = isTrimVisible;
  if (rightTrim) rightTrim.visible = isTrimVisible;
  if (left) poseWing(left, -1, angle, open, size);
  if (right) poseWing(right, 1, angle, open, size);
}
