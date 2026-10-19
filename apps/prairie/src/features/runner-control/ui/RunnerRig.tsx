'use client';

import { FLORA, pushOutOfFlora } from '@entities/flora/model/constants';
import { GroundShadow, Runner, SpinStardust, SprintTrail, WadeSplash } from '@entities/runner/ui';
import { RUNNER_PHYSICS } from '@features/runner-control/model/constants';
import { usePointerLook, useRunnerControls } from '@features/runner-control/model/hooks';
import {
  createDashState,
  createSpinState,
  DASH_SKILL,
  SPIN_SKILL,
  updateDash,
  updateSpin,
} from '@features/runner-control/model/services';
import { getRunnerInput } from '@features/runner-control/model/store';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CAMERA,
  distanceToRiver,
  RIVER,
  riverBearing,
  riverBedDepthAt,
  riverWaterDepthAt,
  terrainHeightAt,
} from '@shared/config';
import { runnerState, setRideRiver } from '@shared/r3f';
import { useRef } from 'react';
import { Group, MathUtils, PerspectiveCamera, Vector3 } from 'three';

const forwardVec = new Vector3();
const camDirVec = new Vector3();
const desiredCam = new Vector3();
const desiredTarget = new Vector3();
const smoothTarget = new Vector3();

// 질주 시 FOV를 벌려 속도감을 준다.
const SPRINT_FOV_BOOST = 8;
const FOV_RESPONSE = 5;

// 자유 이동: WASD/터치로 가속·방향 전환(말이 진행 방향을 바라봄). Shift 질주(돌풍 파동), Space 점프·누르면 비행.
// 카메라는 말 뒤를 낮게 따라가며 말을 화면 중앙에 둔다. PC에선 드래그로 좌우 시점(yaw) 회전.
export function RunnerRig() {
  useRunnerControls();
  const camera = useThree((state) => state.camera);

  const rootRef = useRef<Group>(null);
  const speedRef = useRef(0);
  const dashRef = useRef(createDashState());
  const spinRef = useRef(createSpinState());
  const rollRef = useRef<Group>(null);
  const headingRef = useRef(0);
  const viewYawRef = useRef(0);
  const positionRef = useRef(new Vector3(0, 0, 0));
  const airborneRef = useRef({ height: 0, velocity: 0 });
  const wasSprintingRef = useRef(false);
  const wasJumpPressedRef = useRef(false);
  const initializedRef = useRef(false);

  usePointerLook(viewYawRef);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { forward, backward, left, right, sprint, jump, spin, dash } = getRunnerInput();
    const physics = RUNNER_PHYSICS;
    const now = state.clock.elapsedTime;

    const air = airborneRef.current;
    const isGrounded = air.height <= 0;
    updateDash(dashRef.current, dash, air.height, delta);
    runnerState.dashStrength = dashRef.current.strength;
    updateSpin(spinRef.current, spin, air.height, delta);
    runnerState.isSpinning = spinRef.current.active;
    runnerState.spinAngle = spinRef.current.angle;
    if (rollRef.current) rollRef.current.rotation.z = spinRef.current.angle;

    // 말은 하상 프로파일을 따라 골로 내려가고, 수심에 비례해 최고속도가 떨어진다. 공중에선 물이 발에 안 닿으니 감속 없음.
    const riverDist = distanceToRiver(positionRef.current.x);
    const waterDepth = riverWaterDepthAt(riverDist);
    const wade = isGrounded ? Math.min(waterDepth / RIVER.wadeDepthRef, 1) : 0;
    const maxSpeed = physics.maxSpeed * MathUtils.lerp(1, RIVER.wadeSpeedScale, wade);
    const groundY = terrainHeightAt(positionRef.current.x, positionRef.current.z) - riverBedDepthAt(riverDist);

    // 질주: 최고속도·가속 배율. 발동 순간 돌풍 파동 원점을 기록한다.
    const isSprinting = sprint && forward;
    if (isSprinting && !wasSprintingRef.current) {
      runnerState.gustOrigin.set(positionRef.current.x, positionRef.current.z);
      runnerState.gustStartedAt = now;
    }
    wasSprintingRef.current = isSprinting;
    const sprintMax = isSprinting ? physics.sprintMaxMultiplier : 1;
    const sprintAccel = isSprinting ? physics.sprintAccelMultiplier : 1;

    let speed = speedRef.current;
    if (forward) speed += physics.accel * sprintAccel * delta;
    else if (backward) speed -= physics.brake * delta;
    else speed -= MathUtils.clamp(speed, -physics.coastDecel * delta, physics.coastDecel * delta);
    const normalMax = maxSpeed * sprintMax;
    const dashSpeed = MathUtils.lerp(normalMax, DASH_SKILL.speed, dashRef.current.strength);
    if (dashRef.current.active) speed = Math.max(speed, DASH_SKILL.speed * dashRef.current.strength);
    // 부스트가 끝나면 속도를 즉시 자르지 않고 일반 최고속도로 감속한다.
    const speedLimit = Math.max(dashSpeed, speedRef.current - physics.brake * delta);
    speed = MathUtils.clamp(speed, -physics.maxReverse, speedLimit);
    speedRef.current = speed;

    // 점프·비행: 지면에서 Space = 점프, 공중에서 Space 유지 = 상승. 놓으면 활공 속도로 하강, 고도 상한.
    const jumpPressed = jump && !wasJumpPressedRef.current;
    wasJumpPressedRef.current = jump;
    if (jumpPressed && isGrounded) air.velocity = physics.jumpSpeed;
    if (!isGrounded || air.velocity > 0) {
      const isLifting = jump && !isGrounded;
      air.velocity = isLifting
        ? Math.min(air.velocity + physics.liftAccel * delta, physics.climbSpeed)
        : Math.max(air.velocity - physics.jumpGravity * delta, -physics.glideFallSpeed);
      // 회전하는 동안 고도를 유지해 날개가 지면에 닿지 않게 한다.
      if (spinRef.current.active || dashRef.current.active) air.velocity = Math.max(0, air.velocity);
      air.height = MathUtils.clamp(air.height + air.velocity * delta, 0, physics.maxFlightHeight);
      if (air.height === physics.maxFlightHeight) air.velocity = Math.min(air.velocity, 0);
      if (air.height === 0 && air.velocity < 0) {
        air.velocity = 0;
        runnerState.landedAt = now;
      }
    }
    const visualY = groundY + air.height;

    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    const direction = speed < 0 ? -1 : 1;
    const turnAuthority = MathUtils.clamp(Math.abs(speed) / 4, physics.turnFloor, 1);
    headingRef.current +=
      steer * physics.steerRate * delta * turnAuthority * direction * (1 - dashRef.current.strength * 0.55);
    const heading = headingRef.current;

    forwardVec.set(Math.sin(heading), 0, Math.cos(heading));
    const position = positionRef.current;
    position.addScaledVector(forwardVec, speed * delta);
    // 줄기·바위 충돌: 밀어내고 속도를 깎는다. 줄기 높이 위로 날면 통과.
    if (air.height < FLORA.trunk.height && pushOutOfFlora(position) > 0) speedRef.current = speed * 0.5;

    const root = rootRef.current;
    if (root) {
      root.position.copy(position).setY(visualY);
      root.rotation.y = heading;
    }

    runnerState.position.copy(position).setY(visualY);
    runnerState.heading = heading;
    runnerState.speed = speed;
    runnerState.waterDepth = waterDepth;
    runnerState.isSprinting = isSprinting;
    runnerState.airborneHeight = air.height;
    runnerState.verticalSpeed = air.velocity;

    const frameCamera = state.camera;
    if (frameCamera instanceof PerspectiveCamera) {
      const targetFov =
        CAMERA.fov + Math.max(isSprinting ? SPRINT_FOV_BOOST : 0, dashRef.current.strength * DASH_SKILL.fovBoost);
      const nextFov = MathUtils.damp(frameCamera.fov, targetFov, FOV_RESPONSE, delta);
      if (Math.abs(nextFov - frameCamera.fov) > 0.01) {
        frameCamera.fov = nextFov;
        frameCamera.updateProjectionMatrix();
      }
    }

    // 카메라 방향 = 말의 heading + 마우스 드래그 yaw 오프셋(말은 heading 그대로, 카메라만 좌우로 돈다).
    const camYaw = heading + viewYawRef.current;
    camDirVec.set(Math.sin(camYaw), 0, Math.cos(camYaw));
    desiredCam
      .copy(position)
      .addScaledVector(camDirVec, -CAMERA.followDistance)
      .setY(visualY + CAMERA.followHeight);
    // 말 뒤 언덕이 솟아 있으면 카메라가 지면 아래로 묻힌다 → 그 자리 지형 위 최소 높이를 보장.
    desiredCam.y = Math.max(desiredCam.y, terrainHeightAt(desiredCam.x, desiredCam.z) + CAMERA.groundClearance);
    desiredTarget.copy(position).setY(CAMERA.targetHeight + visualY);

    if (!initializedRef.current) {
      camera.position.copy(desiredCam);
      smoothTarget.copy(desiredTarget);
      initializedRef.current = true;
    } else {
      camera.position.lerp(desiredCam, CAMERA.positionLerp);
      smoothTarget.lerp(desiredTarget, CAMERA.targetLerp);
    }
    camera.lookAt(smoothTarget);

    setRideRiver(distanceToRiver(position.x), riverBearing(position.x, camYaw));
  });

  return (
    <>
      <group ref={rootRef}>
        <group ref={rollRef} position={[0, SPIN_SKILL.pivotHeight, 0]}>
          <group position={[0, -SPIN_SKILL.pivotHeight, 0]}>
            <Runner speedRef={speedRef} />
          </group>
        </group>
      </group>
      <GroundShadow />
      <WadeSplash />
      <SprintTrail />
      <SpinStardust />
    </>
  );
}
