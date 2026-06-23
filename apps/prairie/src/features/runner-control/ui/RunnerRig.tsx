'use client';

import { Runner } from '@entities/runner/ui';
import { useFrame, useThree } from '@react-three/fiber';
import { CAMERA } from '@shared/config';
import { setRideSpeed } from '@shared/r3f';
import { useRef } from 'react';
import { Group, MathUtils, Vector3 } from 'three';
import { RUNNER_PHYSICS } from '../model/constants';
import { useRunnerControls } from '../model/hooks/useRunnerControls';

const forwardVec = new Vector3();
const desiredCam = new Vector3();
const desiredTarget = new Vector3();
const smoothTarget = new Vector3();

// 자유 이동: WASD로 가속·방향 전환(말이 진행 방향을 바라봄).
// 카메라는 말 뒤를 낮게 따라가며 말을 화면 중앙에 둔다(마우스 조작 없음).
export function RunnerRig() {
  const input = useRunnerControls();
  const camera = useThree((state) => state.camera);

  const rootRef = useRef<Group>(null);
  const speedRef = useRef(0);
  const headingRef = useRef(0);
  const positionRef = useRef(new Vector3(0, 0, 0));
  const initializedRef = useRef(false);

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { forward, backward, left, right } = input.current;
    const physics = RUNNER_PHYSICS;

    let speed = speedRef.current;
    if (forward) speed += physics.accel * delta;
    else if (backward) speed -= physics.brake * delta;
    else speed -= MathUtils.clamp(speed, -physics.coastDecel * delta, physics.coastDecel * delta);
    speed = MathUtils.clamp(speed, -physics.maxReverse, physics.maxSpeed);
    speedRef.current = speed;

    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    const direction = speed < 0 ? -1 : 1;
    const turnAuthority = MathUtils.clamp(Math.abs(speed) / 4, physics.turnFloor, 1);
    headingRef.current += steer * physics.steerRate * delta * turnAuthority * direction;
    const heading = headingRef.current;

    forwardVec.set(Math.sin(heading), 0, Math.cos(heading));
    const position = positionRef.current;
    position.addScaledVector(forwardVec, speed * delta);

    const root = rootRef.current;
    if (root) {
      root.position.copy(position);
      root.rotation.y = heading;
    }

    desiredCam.copy(position).addScaledVector(forwardVec, -CAMERA.followDistance).setY(CAMERA.followHeight);
    desiredTarget.copy(position).setY(CAMERA.targetHeight);

    if (!initializedRef.current) {
      camera.position.copy(desiredCam);
      smoothTarget.copy(desiredTarget);
      initializedRef.current = true;
    } else {
      camera.position.lerp(desiredCam, CAMERA.positionLerp);
      smoothTarget.lerp(desiredTarget, CAMERA.targetLerp);
    }
    camera.lookAt(smoothTarget);

    setRideSpeed(Math.abs(speed) * physics.speedToKmh);
  });

  return (
    <group ref={rootRef}>
      <Runner speedRef={speedRef} />
    </group>
  );
}
