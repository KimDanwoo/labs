import type { DynamicRayCastVehicleController, RigidBody } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { PhysicsStep } from '@views/drive/lib/engine/game/physics/physicsTypes';
import {
  DRIVE,
  FIXED_STEP,
  FORWARD_RATIO_THRESHOLD,
  ICE_FRICTION_SLIP,
  JUST_TOUCHED_WINDOW,
  STEERED_WHEELS,
  SUSPENSION_HEIGHTS,
  SUSPENSION_STIFFNESS,
  suspensionAt,
  WHEEL_COUNT,
  WHEEL_SETTINGS,
  type VehicleWheel,
} from '@views/drive/lib/engine/game/physics/vehicleConfig';
import { QUALITY } from '@views/drive/lib/engine/game/quality';
import { lerp } from '@views/drive/lib/engine/game/utilities/maths';

import type { PhysicsVehicle } from '@views/drive/lib/engine/game/physics/physicsVehicle';

function engineAndBrake(
  speed: number,
  isGoingForward: boolean,
  stepScaled: number,
): { engineForce: number; brake: number } {
  const { player } = getGame();
  const topSpeed = lerp(DRIVE.topSpeed, DRIVE.topSpeedBoost, player.boosting);
  const overflowSpeed = Math.max(0, speed - topSpeed);
  const boost = 1 + player.boosting * DRIVE.boostMultiplier;
  const engineForce = ((player.accelerating * boost * DRIVE.engineForceAmplitude) / (1 + overflowSpeed)) * stepScaled;

  const isIdle = !player.braking && Math.abs(player.accelerating) < DRIVE.idleAcceleration;
  const isReversing =
    speed > DRIVE.reverseSpeed &&
    ((player.accelerating > 0 && !isGoingForward) || (player.accelerating < 0 && isGoingForward));
  const idleOrPlayerBrake = isIdle ? DRIVE.idleBrake : player.braking;
  const baseBrake = isReversing ? DRIVE.reverseBrake : idleOrPlayerBrake;
  return {
    engineForce: isReversing ? 0 : engineForce,
    brake: baseBrake * (DRIVE.brakeAmplitude * stepScaled),
  };
}

function frictionSlip(groundBody: RigidBody | null): number {
  const { waterSurface } = getGame().world;
  const iceRatio = waterSurface?.iceRatio;
  const isOnIce = waterSurface?.ice !== undefined && groundBody === waterSurface.ice.physical.body;
  if (!isOnIce) return WHEEL_SETTINGS.frictionSlip;
  if (!iceRatio) return WHEEL_SETTINGS.frictionSlip;
  return lerp(WHEEL_SETTINGS.frictionSlip, ICE_FRICTION_SLIP, iceRatio.value);
}

export function driveController(
  controller: DynamicRayCastVehicleController,
  speed: number,
  isGoingForward: boolean,
  step: PhysicsStep,
): void {
  const game = getGame();
  const { engineForce, brake } = engineAndBrake(speed, isGoingForward, step.scaled);
  const steer = game.player.steering * DRIVE.steeringAmplitude;
  for (const index of STEERED_WHEELS) controller.setWheelSteering(index, steer);

  for (let index = 0; index < WHEEL_COUNT; index += 1) {
    const suspension = suspensionAt(index);
    controller.setWheelBrake(index, brake);
    controller.setWheelEngineForce(index, engineForce);
    controller.setWheelSuspensionRestLength(index, SUSPENSION_HEIGHTS[suspension]);
    controller.setWheelSuspensionStiffness(index, SUSPENSION_STIFFNESS[suspension]);
    const groundObject = controller.wheelGroundObject(index);
    const isOverWater = groundObject && game.world.waterSurface;
    if (isOverWater) {
      controller.setWheelFrictionSlip(index, frictionSlip(groundObject.parent()));
    }
  }

  const isLowQuality = game.quality.level === QUALITY.low;
  controller.updateVehicle(isLowQuality ? FIXED_STEP : Math.min(FIXED_STEP, step.real));
}

export function updateKinematics(vehicle: PhysicsVehicle): void {
  const { ticker } = getGame();
  const { body } = vehicle.chassis.physical;
  const newPosition = new THREE.Vector3().copy(body.translation());
  vehicle.velocity.copy(newPosition).sub(vehicle.position);
  vehicle.direction.copy(vehicle.velocity).normalize();
  vehicle.position.copy(newPosition);
  vehicle.quaternion.copy(body.rotation());
  vehicle.sideward.set(0, 0, 1).applyQuaternion(vehicle.quaternion);
  vehicle.upward.set(0, 1, 0).applyQuaternion(vehicle.quaternion);
  vehicle.forward.set(1, 0, 0).applyQuaternion(vehicle.quaternion);
  vehicle.speed = vehicle.velocity.length() / ticker.deltaScaled;
  vehicle.xzSpeed = Math.hypot(vehicle.velocity.x, vehicle.velocity.z) / ticker.deltaScaled;
  vehicle.forwardRatio = vehicle.direction.dot(vehicle.forward);
  vehicle.isGoingForward = vehicle.forwardRatio > FORWARD_RATIO_THRESHOLD;
  vehicle.forwardSpeed = vehicle.speed * vehicle.forwardRatio;
  vehicle.xRotation = new THREE.Euler().setFromQuaternion(vehicle.quaternion, 'XYZ').x;
  vehicle.yRotation = new THREE.Euler().setFromQuaternion(vehicle.quaternion, 'YXZ').y;
  vehicle.zRotation = new THREE.Euler().setFromQuaternion(vehicle.quaternion, 'ZYX').z;
}

export function readWheelContacts(controller: DynamicRayCastVehicleController, wheels: PhysicsVehicle['wheels']): void {
  const { elapsed } = getGame().ticker;
  let inContactCount = 0;
  for (const [index, wheel] of wheels.items.entries()) {
    const inContact = controller.wheelIsInContact(index);
    const hasJustTouched = inContact && !wheel.inContact;
    if (hasJustTouched) wheel.lastTouchTime = elapsed;
    wheel.inContact = inContact;
    wheel.contactPoint = controller.wheelContactPoint(index);
    wheel.suspensionLength = controller.wheelSuspensionLength(index);
    if (inContact) inContactCount += 1;
  }

  const hasLanded = inContactCount > wheels.inContactCount;
  const isRecent = (wheel: VehicleWheel): boolean => wheel.lastTouchTime > elapsed - JUST_TOUCHED_WINDOW;
  wheels.justTouchedCount = hasLanded ? wheels.items.filter(isRecent).length : 0;
  wheels.inContactCount = inContactCount;
}
