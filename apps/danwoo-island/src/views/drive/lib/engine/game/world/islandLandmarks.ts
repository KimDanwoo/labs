import * as THREE from 'three/webgpu';

import { createFountainWater } from './fountainWater';
import { type IslandModelKey, islandModelMesh } from './islandModels';
import { placedInArea } from './layout/areaPlacement';

interface LandmarkCollider {
  readonly size: THREE.Vector3;
  readonly position: THREE.Vector3;
}

export interface Landmark {
  readonly key: IslandModelKey;
  readonly size: THREE.Vector3;
  readonly colliders: readonly LandmarkCollider[];
  readonly decorate?: () => THREE.Object3D;
}

interface PlacedLandmark extends Landmark {
  readonly pattern: RegExp;
  readonly offset?: THREE.Vector3;
}

interface BeachSpot extends Landmark {
  readonly pattern: RegExp;
  readonly position: THREE.Vector3;
}

type Triple = readonly [number, number, number];

const collider = (size: Triple, position: Triple): LandmarkCollider => ({
  size: new THREE.Vector3(...size),
  position: new THREE.Vector3(...position),
});

const FOUNTAIN_SCALE = 1.35;

const SHELL_FOUNTAIN: Landmark = {
  key: 'shellFountain',
  decorate: () => {
    const water = createFountainWater();
    water.scale.setScalar(FOUNTAIN_SCALE);
    return water;
  },
  size: new THREE.Vector3(2.6, 2.4, 2.6).multiplyScalar(FOUNTAIN_SCALE),
  colliders: [collider([2.3, 1.2, 2.3], [0, 0.6, 0]), collider([1.4, 2.2, 1.4], [0, 1.1, 0])].map(
    ({ size, position }) => ({
      size: size.multiplyScalar(FOUNTAIN_SCALE),
      position: position.multiplyScalar(FOUNTAIN_SCALE),
    }),
  ),
};

const PALM_HAMMOCK: Landmark = {
  key: 'palmHammock',
  size: new THREE.Vector3(3.8, 3.8, 2.4),
  colliders: [collider([0.35, 3, 0.35], [-0.85, 1.5, -0.27]), collider([0.35, 3, 0.35], [0.85, 1.5, -0.27])],
};

const SURF_CORNER: Landmark = {
  key: 'surfCorner',
  size: new THREE.Vector3(3.4, 2.8, 2.6),
  colliders: [collider([1.6, 1.9, 0.5], [-0.75, 0.95, -0.4])],
};

export const LIGHTHOUSE: Landmark = {
  key: 'lighthouse',
  size: new THREE.Vector3(1.5, 4.6, 1.5),
  colliders: [collider([1, 4.4, 1], [0, 2.2, 0])],
};

const LANDMARKS: readonly PlacedLandmark[] = [
  { pattern: /^refStatuePhysicalDynamic$/, ...SHELL_FOUNTAIN },
  { pattern: /^gamepadPhysicalDynamic/, ...PALM_HAMMOCK, offset: new THREE.Vector3(1, 0, 0) },
];

const BEACH_SPOTS: readonly BeachSpot[] = [
  {
    pattern: /^gamepadPhysicalDynamic/,
    ...SURF_CORNER,
    position: placedInArea('landing', new THREE.Vector3(56, 0, 37.6)),
  },
];

const REMOVED = /^(baguira|boy|sudo|phone)PhysicalDynamic/;
const CUBOID = /^cuboid/;

function colliderFloor(object: THREE.Object3D): number | null {
  object.updateMatrix();
  const bottoms = object.children
    .filter((child) => CUBOID.test(child.name))
    .map(
      (cuboid) =>
        cuboid.position
          .clone()
          .add(new THREE.Vector3(0, -cuboid.scale.y / 2, 0))
          .applyMatrix4(object.matrix).y,
    );
  return bottoms.length ? Math.min(...bottoms) : null;
}

function footprintOf(model: THREE.Object3D, object: THREE.Object3D): THREE.Vector3 {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object).applyMatrix4(model.matrixWorld.clone().invert());
  const center = box.getCenter(new THREE.Vector3());
  return new THREE.Vector3(center.x, colliderFloor(object) ?? box.min.y, center.z);
}

export function fixedLandmark(
  { key, size, colliders, decorate }: Landmark,
  base: THREE.Vector3,
  quaternion: THREE.Quaternion,
): THREE.Group {
  const landmark = new THREE.Group();
  landmark.name = `${key}PhysicalFixed`;
  landmark.position.copy(base);
  landmark.quaternion.copy(quaternion);
  landmark.add(islandModelMesh(key, new THREE.Matrix4().makeTranslation(0, size.y / 2, 0), size));
  if (decorate) landmark.add(decorate());
  for (const { size: colliderSize, position } of colliders) {
    const cuboid = new THREE.Object3D();
    cuboid.name = 'cuboid';
    cuboid.scale.copy(colliderSize);
    cuboid.position.copy(position);
    landmark.add(cuboid);
  }
  return landmark;
}

export function placeLandmarks(model: THREE.Object3D): void {
  for (const child of [...model.children]) {
    const landmark = LANDMARKS.find(({ pattern }) => pattern.test(child.name));
    if (landmark) {
      const base = footprintOf(model, child).add(landmark.offset ?? new THREE.Vector3());
      model.add(fixedLandmark(landmark, base, child.quaternion));
    }
    for (const spot of BEACH_SPOTS.filter(({ pattern }) => pattern.test(child.name))) {
      model.add(fixedLandmark(spot, model.worldToLocal(spot.position.clone()), new THREE.Quaternion()));
    }
    if (landmark || REMOVED.test(child.name)) child.removeFromParent();
  }
}
