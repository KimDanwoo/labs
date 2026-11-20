import { CAMERA, CINEMATIC } from '@views/ride/config/scene';
import {
  camDirVec,
  desiredCam,
  desiredTarget,
  forwardVec,
  FOV_RESPONSE,
  RIG,
  smoothTarget,
  SPRINT_FOV_BOOST,
} from '@views/ride/lib/runner-control/runnerRig';
import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import type { CAMERA_PRESETS } from '@views/ride/model/ride-settings/constants';
import { DASH_SKILL } from '@views/ride/model/runner-control/services/dashSkill';
import type { RunnerMotion } from '@views/ride/model/runner-control/services/runnerMotion';
import { type Camera, MathUtils, PerspectiveCamera } from 'three';

type CameraRefs = {
  viewYawRef: { current: number };
  viewPitchRef: { current: number };
  restingYawRef: { current: number };
  initializedRef: { current: boolean };
};

export const speedFovBoost = (isSprinting: boolean, dashStrength: number, isReducedMotion: boolean): number =>
  isReducedMotion ? 0 : Math.max(isSprinting ? SPRINT_FOV_BOOST : 0, dashStrength * DASH_SKILL.fovBoost);

export function followRunnerCamera(
  { viewYawRef, viewPitchRef, restingYawRef, initializedRef }: CameraRefs,
  camera: Camera,
  frameCamera: Camera,
  cameraPreset: (typeof CAMERA_PRESETS)[keyof typeof CAMERA_PRESETS],
  { position, heading, speed, visualY }: RunnerMotion,
  fovBoost: number,
  delta: number,
) {
  if (frameCamera instanceof PerspectiveCamera) {
    const targetFov = CAMERA.fov + fovBoost;
    const nextFov = MathUtils.damp(frameCamera.fov, targetFov, FOV_RESPONSE, delta);
    if (Math.abs(nextFov - frameCamera.fov) > RIG.fovEpsilon) {
      frameCamera.fov = nextFov;
      frameCamera.updateProjectionMatrix();
    }
  }

  restingYawRef.current = MathUtils.damp(
    restingYawRef.current,
    cameraPreset.yaw * (1 - MathUtils.smoothstep(Math.abs(speed), RIG.restingYawFade.from, RIG.restingYawFade.to)),
    CINEMATIC.camera.response,
    delta,
  );
  const camYaw = heading + viewYawRef.current + restingYawRef.current;
  camDirVec.set(Math.sin(camYaw), 0, Math.cos(camYaw));
  const speedFraming = MathUtils.clamp(Math.abs(speed) / RIG.framing.fullSpeed, 0, 1);
  desiredCam
    .copy(position)
    .addScaledVector(camDirVec, -(cameraPreset.distance + speedFraming * RIG.framing.distance))
    .setY(
      visualY + cameraPreset.height + viewPitchRef.current * cameraPreset.distance + speedFraming * RIG.framing.height,
    );
  desiredCam.y = Math.max(desiredCam.y, terrainHeightAt(desiredCam.x, desiredCam.z) + CAMERA.groundClearance);
  desiredTarget
    .copy(position)
    .addScaledVector(forwardVec, speedFraming * RIG.framing.lookAhead)
    .setY(cameraPreset.targetHeight + visualY);

  if (!initializedRef.current) {
    camera.position.copy(desiredCam);
    smoothTarget.copy(desiredTarget);
    initializedRef.current = true;
  } else {
    camera.position.lerp(desiredCam, 1 - Math.pow(1 - CAMERA.positionLerp, delta * RIG.lerpFrameRate));
    smoothTarget.lerp(desiredTarget, 1 - Math.pow(1 - CAMERA.targetLerp, delta * RIG.lerpFrameRate));
  }
  camera.position.setY(
    Math.max(camera.position.y, terrainHeightAt(camera.position.x, camera.position.z) + CAMERA.groundClearance),
  );
  camera.lookAt(smoothTarget);
  return camYaw;
}
