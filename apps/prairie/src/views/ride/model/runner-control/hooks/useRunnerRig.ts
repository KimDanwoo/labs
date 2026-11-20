import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '@shared/lib/useReducedMotion';
import { useRef } from 'react';
import { Group, Vector3 } from 'three';

import { CINEMATIC, RIVER } from '@views/ride/config/scene';
import { RIG } from '@views/ride/lib/runner-control/runnerRig';
import { coastDistanceAt, distanceToRiver, riverBearing, riverWidthAt } from '@views/ride/lib/scene/terrain';
import { CAMERA_MODE, CAMERA_PRESETS } from '@views/ride/model/ride-settings/constants';
import { cameraSettings } from '@views/ride/model/ride-settings/store/cameraSettings';
import { setRideRiver } from '@views/ride/model/ride-state/rideStore';
import { usePointerLook } from '@views/ride/model/runner-control/hooks/usePointerLook';
import { useRunnerControls } from '@views/ride/model/runner-control/hooks/useRunnerControls';
import { createDashState } from '@views/ride/model/runner-control/services/dashSkill';
import { createFlightState } from '@views/ride/model/runner-control/services/flightDynamics';
import { followRunnerCamera, speedFovBoost } from '@views/ride/model/runner-control/services/runnerCamera';
import { advanceRunner } from '@views/ride/model/runner-control/services/runnerMotion';
import { createSpinState } from '@views/ride/model/runner-control/services/spinSkill';
import { getRunnerInput } from '@views/ride/model/runner-control/store/runnerInput';

// 자유 이동: WASD/터치로 가속·방향 전환(말이 진행 방향을 바라봄). Shift 질주(돌풍 파동), Space 점프·누르면 비행.
// 카메라는 말 뒤를 낮게 따라가며 말을 화면 중앙에 둔다. PC에선 드래그로 좌우 시점(yaw) 회전.
export function useRunnerRig() {
  useRunnerControls();
  const camera = useThree((state) => state.camera);
  const isReducedMotion = useReducedMotion();

  const rootRef = useRef<Group>(null);
  const speedRef = useRef(0);
  const dashRef = useRef(createDashState());
  const spinRef = useRef(createSpinState());
  const rollRef = useRef<Group>(null);
  const headingRef = useRef(0);
  const viewYawRef = useRef(0);
  const viewPitchRef = useRef(0);
  const cameraRevisionRef = useRef(cameraSettings.get().revision);
  const positionRef = useRef(new Vector3(0, 0, 0));
  const airborneRef = useRef(createFlightState());
  const wasSprintingRef = useRef(false);
  const wasJumpPressedRef = useRef(false);
  const initializedRef = useRef(false);
  const restingYawRef = useRef(CINEMATIC.camera.restingYaw as number);
  const telemetryAtRef = useRef(-1);

  usePointerLook(viewYawRef, viewPitchRef);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, RIG.maxFrameDelta);
    const input = getRunnerInput();
    const { forward, backward, left, right, jump, dash } = input;
    const now = state.clock.elapsedTime;
    let cameraSetting = cameraSettings.get();
    if (cameraSetting.mode === CAMERA_MODE.hero && (forward || backward || left || right || jump || dash)) {
      cameraSettings.setMode(CAMERA_MODE.close);
      cameraSetting = cameraSettings.get();
    }
    if (cameraRevisionRef.current !== cameraSetting.revision) {
      viewYawRef.current = 0;
      viewPitchRef.current = 0;
      cameraRevisionRef.current = cameraSetting.revision;
    }
    const cameraPreset = CAMERA_PRESETS[cameraSetting.mode];

    const motion = advanceRunner(
      {
        rootRef,
        rollRef,
        speedRef,
        dashRef,
        spinRef,
        headingRef,
        positionRef,
        airborneRef,
        wasSprintingRef,
        wasJumpPressedRef,
        telemetryAtRef,
      },
      input,
      delta,
      now,
    );
    const { position } = motion;
    const camYaw = followRunnerCamera(
      { viewYawRef, viewPitchRef, restingYawRef, initializedRef },
      camera,
      state.camera,
      cameraPreset,
      motion,
      speedFovBoost(motion.isSprinting, dashRef.current.strength, isReducedMotion),
      delta,
    );

    setRideRiver(
      Math.max(0, distanceToRiver(position.x, position.z) - RIVER.halfWidth) * riverWidthAt(position.z),
      riverBearing(position.x, camYaw, position.z),
      coastDistanceAt(position.x, position.z),
    );
  });

  return { rootRef, rollRef, speedRef };
}
