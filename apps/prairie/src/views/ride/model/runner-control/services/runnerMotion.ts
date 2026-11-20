import type { RefObject } from 'react';
import { type Group, MathUtils, type Vector3 } from 'three';
import { RIVER } from '../../../config/scene';
import { forwardVec, RIG } from '../../../lib/runner-control/runnerRig';
import { groundHeightAt, waterDepthAt } from '../../../lib/scene/terrain';
import { FLORA, pushOutOfFlora } from '../../flora/constants';
import { setRideTelemetry } from '../../ride-state/rideTelemetry';
import { runnerState } from '../../ride-state/runnerState';
import { RUNNER_PHYSICS } from '../constants';
import type { getRunnerInput } from '../store/runnerInput';
import { type createDashState, DASH_SKILL, updateDash } from './dashSkill';
import { type createFlightState, updateFlight } from './flightDynamics';
import { type createSpinState, updateSpin } from './spinSkill';

export type RunnerMotionRefs = {
  rootRef: RefObject<Group | null>;
  rollRef: RefObject<Group | null>;
  speedRef: RefObject<number>;
  dashRef: RefObject<ReturnType<typeof createDashState>>;
  spinRef: RefObject<ReturnType<typeof createSpinState>>;
  headingRef: RefObject<number>;
  positionRef: RefObject<Vector3>;
  airborneRef: RefObject<ReturnType<typeof createFlightState>>;
  wasSprintingRef: RefObject<boolean>;
  wasJumpPressedRef: RefObject<boolean>;
  telemetryAtRef: RefObject<number>;
};

export type RunnerMotion = { position: Vector3; heading: number; speed: number; visualY: number; isSprinting: boolean };

type RunnerInput = ReturnType<typeof getRunnerInput>;

function updateSkills(refs: RunnerMotionRefs, input: RunnerInput, airHeight: number, delta: number): void {
  const { rollRef, dashRef, spinRef } = refs;
  updateDash(dashRef.current, input.dash, airHeight, delta);
  runnerState.dashStrength = dashRef.current.strength;
  updateSpin(spinRef.current, input.spin, airHeight, delta);
  runnerState.isSpinning = spinRef.current.active;
  runnerState.spinAngle = spinRef.current.angle;
  if (rollRef.current) rollRef.current.rotation.z = spinRef.current.angle;
}

// 질주: 최고속도·가속 배율. 발동 순간 돌풍 파동 원점을 기록한다.
function markSprintStart(refs: RunnerMotionRefs, isSprinting: boolean, now: number): void {
  const { wasSprintingRef, positionRef } = refs;
  if (isSprinting && !wasSprintingRef.current) {
    runnerState.gustOrigin.set(positionRef.current.x, positionRef.current.z);
    runnerState.gustStartedAt = now;
  }
  wasSprintingRef.current = isSprinting;
}

function accelerate(
  refs: RunnerMotionRefs,
  input: RunnerInput,
  isSprinting: boolean,
  isGrounded: boolean,
  delta: number,
): number {
  const { speedRef, dashRef, positionRef } = refs;
  const physics = RUNNER_PHYSICS;
  // 말은 하상 프로파일을 따라 골로 내려가고, 수심에 비례해 최고속도가 떨어진다. 공중에선 물이 발에 안 닿으니 감속 없음.
  const waterDepth = waterDepthAt(positionRef.current.x, positionRef.current.z);
  const wade = isGrounded ? Math.min(waterDepth / RIVER.wadeDepthRef, 1) : 0;
  const maxSpeed = physics.maxSpeed * MathUtils.lerp(1, RIVER.wadeSpeedScale, wade);
  const sprintMax = isSprinting ? physics.sprintMaxMultiplier : 1;
  const sprintAccel = isSprinting ? physics.sprintAccelMultiplier : 1;

  let speed = speedRef.current;
  if (input.forward) speed += physics.accel * sprintAccel * delta;
  else if (input.backward) speed -= physics.brake * delta;
  else {
    const drag = physics.coastDecel * (isGrounded ? 1 : RIG.airborneDragFactor) * delta;
    speed -= MathUtils.clamp(speed, -drag, drag);
  }
  const normalMax = maxSpeed * sprintMax;
  const dashSpeed = MathUtils.lerp(normalMax, DASH_SKILL.speed, dashRef.current.strength);
  if (dashRef.current.active) speed = Math.max(speed, DASH_SKILL.speed * dashRef.current.strength);
  // 부스트가 끝나면 속도를 즉시 자르지 않고 일반 최고속도로 감속한다.
  const speedLimit = Math.max(dashSpeed, speedRef.current - physics.brake * delta);
  speed = MathUtils.clamp(speed, -physics.maxReverse, speedLimit);
  speedRef.current = speed;
  return speed;
}

function steerHeading(refs: RunnerMotionRefs, input: RunnerInput, speed: number, delta: number): number {
  const { headingRef, dashRef } = refs;
  const physics = RUNNER_PHYSICS;
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const direction = speed < 0 ? -1 : 1;
  const turnAuthority = MathUtils.clamp(Math.abs(speed) / RIG.fullTurnSpeed, physics.turnFloor, 1);
  headingRef.current +=
    steer *
    physics.steerRate *
    delta *
    turnAuthority *
    direction *
    (1 - dashRef.current.strength * RIG.dashSteerDamping);
  return headingRef.current;
}

function moveAndCollide(refs: RunnerMotionRefs, speed: number, heading: number, delta: number): Vector3 {
  const { speedRef, positionRef, airborneRef } = refs;
  forwardVec.set(Math.sin(heading), 0, Math.cos(heading));
  const position = positionRef.current;
  position.addScaledVector(forwardVec, speed * delta);
  // 줄기·바위 충돌: 밀어내고 속도를 깎는다. 줄기 높이 위로 날면 통과.
  if (airborneRef.current.height < FLORA.trunk.height && pushOutOfFlora(position) > 0)
    speedRef.current = speed * RIG.collisionSpeedFactor;
  return position;
}

interface Landing {
  groundY: number;
  waterDepth: number;
}

function flyAndLand(
  refs: RunnerMotionRefs,
  input: RunnerInput,
  position: Vector3,
  delta: number,
  now: number,
): Landing {
  const { speedRef, dashRef, spinRef, airborneRef, wasJumpPressedRef } = refs;
  // 이동과 충돌 보정 뒤의 위치에서 지면을 샘플링해 발이 언덕에 묻히지 않게 한다.
  // Buoyancy keeps the horse above deep water instead of walking along the seabed.
  const waterDepth = waterDepthAt(position.x, position.z);
  const bedY = groundHeightAt(position.x, position.z);
  const groundY = waterDepth > 0 ? Math.max(bedY, -RIVER.waterDrop - RIG.floatClearance) : bedY;
  const impact = updateFlight(
    airborneRef.current,
    {
      lift: input.jump,
      launch: input.jump && !wasJumpPressedRef.current,
      descend: input.descend,
      holdAltitude: spinRef.current.active || dashRef.current.active,
      speed: speedRef.current,
    },
    groundY,
    delta,
  );
  wasJumpPressedRef.current = input.jump;
  if (impact !== null) {
    runnerState.landedAt = now;
    runnerState.landingImpact = impact;
  }
  return { groundY, waterDepth };
}

function publishRunner(refs: RunnerMotionRefs, motion: RunnerMotion, waterDepth: number, now: number): void {
  const { rootRef, speedRef, airborneRef, telemetryAtRef } = refs;
  const air = airborneRef.current;
  const root = rootRef.current;
  if (root) {
    root.position.copy(motion.position).setY(motion.visualY);
    root.rotation.y = motion.heading;
  }
  runnerState.position.copy(motion.position).setY(motion.visualY);
  runnerState.heading = motion.heading;
  runnerState.speed = speedRef.current;
  runnerState.waterDepth = waterDepth;
  runnerState.isSprinting = motion.isSprinting;
  runnerState.airborneHeight = air.height;
  runnerState.verticalSpeed = air.velocity;
  if (now - telemetryAtRef.current > RIG.telemetryIntervalS) {
    setRideTelemetry(speedRef.current, air.height);
    telemetryAtRef.current = now;
  }
}

export function advanceRunner(refs: RunnerMotionRefs, input: RunnerInput, delta: number, now: number): RunnerMotion {
  const air = refs.airborneRef.current;
  const isGrounded = air.height <= 0;
  updateSkills(refs, input, air.height, delta);
  const isSprinting = input.sprint && input.forward;
  markSprintStart(refs, isSprinting, now);
  const speed = accelerate(refs, input, isSprinting, isGrounded, delta);
  const heading = steerHeading(refs, input, speed, delta);
  const position = moveAndCollide(refs, speed, heading, delta);
  const landing = flyAndLand(refs, input, position, delta, now);
  const motion = { position, heading, speed, visualY: landing.groundY + air.height, isSprinting };
  publishRunner(refs, motion, landing.waterDepth, now);
  return motion;
}
