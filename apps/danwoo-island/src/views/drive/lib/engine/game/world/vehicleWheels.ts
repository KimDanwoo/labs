import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { Track } from '@views/drive/lib/engine/game/tracks';
import { remapClamp } from '@views/drive/lib/engine/game/utilities/maths';
import {
  type Antenna,
  ANTENNA_TARGET,
  MIRRORED_WHEELS,
  type VisualWheel,
  WHEEL_COUNT,
  WHEEL_EASING,
  WHEEL_MAX_Y,
  WHEEL_ROTATION_SCALE,
} from '@views/drive/lib/engine/game/world/visualVehicleParts';

export function createWheels(template: THREE.Object3D, chassis: THREE.Object3D): VisualWheel[] {
  const game = getGame();
  return Array.from({ length: WHEEL_COUNT }, (_, index) => {
    const container = template.clone(true);
    chassis.add(container);
    let suspension: THREE.Object3D | null = null;
    let cylinder: THREE.Object3D | null = null;
    let painted: THREE.Mesh | null = null;
    container.traverse((child) => {
      if (child.name.startsWith('wheelSuspension')) suspension = child;
      if (child.name.startsWith('wheelCylinder')) cylinder = child;
      if (child.name.startsWith('wheelPainted') && child instanceof THREE.Mesh) painted = child;
    });
    if (!cylinder) throw new Error('Wheel cylinder is missing');
    const wheelCylinder: THREE.Object3D = cylinder;
    wheelCylinder.position.set(0, 0, 0);
    if (MIRRORED_WHEELS.has(index)) container.rotation.y = Math.PI;
    return {
      container,
      cylinder: wheelCylinder,
      suspension,
      painted,
      groundTrack: game.tracks.add(new Track(0.5, 'r')),
    };
  });
}

export function updateWheels(wheels: readonly VisualWheel[], steering: number): void {
  const { physicalVehicle: vehicle, inputs, ticker } = getGame();
  const wheelsRotation = (vehicle.forwardSpeed / vehicle.wheels.settings.radius) * WHEEL_ROTATION_SCALE;
  const isActive = (name: string): boolean => inputs.actions.get(name)?.active ?? false;
  const isRolling = !isActive('brake') || isActive('forward') || isActive('backward');

  for (const [index, wheel] of wheels.entries()) {
    const physicalWheel = vehicle.wheels.items[index];
    if (!physicalWheel) continue;
    if (isRolling) wheel.cylinder.rotation.z += MIRRORED_WHEELS.has(index) ? wheelsRotation : -wheelsRotation;
    if (index === 0) wheel.container.rotation.y = Math.PI + steering;
    if (index === 1) wheel.container.rotation.y = steering;
    placeWheel(wheel, physicalWheel, ticker.deltaScaled);
  }
}

type PhysicalWheel = ReturnType<typeof getGame>['physicalVehicle']['wheels']['items'][number];

function placeWheel(wheel: VisualWheel, physicalWheel: PhysicalWheel, deltaScaled: number): void {
  const wheelY = Math.min(physicalWheel.basePosition.y - (physicalWheel.suspensionLength ?? 0), WHEEL_MAX_Y);
  wheel.container.position.x = physicalWheel.basePosition.x;
  wheel.container.position.y += (wheelY - wheel.container.position.y) * WHEEL_EASING * deltaScaled;
  wheel.container.position.z = physicalWheel.basePosition.z;
  if (wheel.suspension) wheel.suspension.scale.y = Math.abs(wheel.container.position.y) - 0.5;
  if (physicalWheel.contactPoint) {
    wheel.groundTrack.update(new THREE.Vector3().copy(physicalWheel.contactPoint), physicalWheel.inContact);
  }
}

export function createAntenna(object: THREE.Object3D | undefined): Antenna | null {
  if (!object) return null;
  const game = getGame();
  const head = game.model('vehicle').scene.getObjectByName('antennaHead');
  const headAxle = head?.children[0];
  const headReference = object.getObjectByName('antennaHeadReference');
  if (!head || !headAxle || !headReference) throw new Error('Antenna parts are missing');
  game.materials.updateObject(head);
  game.scene.add(head);
  return { object, head, headAxle, headReference };
}

export function updateAntenna(antenna: Antenna | null, chassis: THREE.Object3D): void {
  if (!antenna) return;
  const { physicalVehicle: vehicle, ticker } = getGame();
  const { object, head, headAxle, headReference } = antenna;
  const angle = Math.atan2(ANTENNA_TARGET.x - vehicle.position.x, ANTENNA_TARGET.z - vehicle.position.z);
  object.rotation.y = angle - chassis.rotation.y;
  headReference.getWorldPosition(head.position);
  head.lookAt(ANTENNA_TARGET);
  const speed = remapClamp(ANTENNA_TARGET.distanceTo(vehicle.position), [50, 5], [1, 10]);
  headAxle.rotation.z += ticker.deltaScaled * speed;
}
