import type { DynamicRayCastVehicleController } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import type { Physical } from './physicsTypes';
import { type VehicleWheel, CHASSIS_FRICTION, WHEEL_SETTINGS, wheelPositions } from './vehicleConfig';

import type { PhysicsVehicle } from './physicsVehicle';

export function createChassis(position: THREE.Vector3): { physical: Physical; mass: number } {
  const game = getGame();
  const { physical } = game.objects.add(null, {
    type: 'dynamic',
    position,
    friction: CHASSIS_FRICTION,
    rotation: new THREE.Quaternion(),
    colliders: [
      {
        shape: 'cuboid',
        mass: 2.5,
        parameters: [1.3, 0.4, 0.85],
        position: { x: 0, y: -0.1, z: 0 },
        centerOfMass: { x: 0, y: -0.5, z: 0 },
      },
      { shape: 'cuboid', mass: 0, parameters: [0.5, 0.15, 0.65], position: { x: 0, y: 0.4, z: 0 } },
      {
        shape: 'cuboid',
        mass: 0,
        parameters: [1.5, 0.5, 0.9],
        position: { x: 0.1, y: -0.2, z: 0 },
        category: 'bumper',
      },
    ],
    canSleep: false,
    waterGravityMultiplier: 0,
    onCollision: (force, position) => game.audio.groups.get('hitDefault')?.playRandomNext(force, position),
  });
  if (!physical) throw new Error('Vehicle chassis has no physical body');
  return { physical, mass: physical.body.mass() };
}

export function createWheels(controller: DynamicRayCastVehicleController): PhysicsVehicle['wheels'] {
  const { elapsed } = getGame().ticker;
  const positions = wheelPositions(WHEEL_SETTINGS);
  const items = positions.map((basePosition): VehicleWheel => {
    controller.addWheel(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), 1, 1);
    return { inContact: false, contactPoint: null, suspensionLength: null, lastTouchTime: elapsed, basePosition };
  });
  for (const [index, wheel] of items.entries()) configureWheel(controller, index, wheel);
  return {
    items,
    settings: WHEEL_SETTINGS,
    perimeter: WHEEL_SETTINGS.radius * Math.PI * 2,
    inContactCount: 0,
    justTouchedCount: 0,
  };
}

function configureWheel(
  controller: DynamicRayCastVehicleController,
  index: number,
  { basePosition }: VehicleWheel,
): void {
  const settings = WHEEL_SETTINGS;
  controller.setWheelDirectionCs(index, settings.directionCs);
  controller.setWheelAxleCs(index, settings.axleCs);
  controller.setWheelRadius(index, settings.radius);
  controller.setWheelChassisConnectionPointCs(index, basePosition);
  controller.setWheelFrictionSlip(index, settings.frictionSlip);
  controller.setWheelMaxSuspensionForce(index, settings.maxSuspensionForce);
  controller.setWheelMaxSuspensionTravel(index, settings.maxSuspensionTravel);
  controller.setWheelSideFrictionStiffness(index, settings.sideFrictionStiffness);
  controller.setWheelSuspensionCompression(index, settings.suspensionCompression);
  controller.setWheelSuspensionRelaxation(index, settings.suspensionRelaxation);
}
