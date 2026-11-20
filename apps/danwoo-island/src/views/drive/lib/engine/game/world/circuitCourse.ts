import * as THREE from 'three/webgpu';

import { AREA_ANCHORS, type Point, TRACK } from '@views/drive/lib/engine/game/world/layout/islandLayout';
import {
  isOverWaterJump,
  nearestSample,
  sideOf,
  type TrackSample,
  trackSamples,
} from '@views/drive/lib/engine/game/world/layout/trackPath';
import { stripGeometry } from '@views/drive/lib/engine/game/world/trackGeometry';

const RETIRED = /^(blocks|jump|physicalFixed004|bumpersPhysicalFixed)/;
const ROAD = /^refRoadPhysicalFixed/;
const RAILS = /^refRailsPhysicalFixed/;
const CHECKPOINT = /^refCheckpoints/;
const OBSTACLE = /^refObstacles/;
const LOOSE_OBJECT = /^refObjects/;
const SAMPLE_SPACING = 1;
const CHECKPOINT_COUNT = 10;
const CHECKPOINT_MARGIN = 4;
const JUMP_RUN_UP = 14;
const RAIL = { gap: 1.6, height: 1.5 } as const;
const OBSTACLE_SPACING = 8;
const OBSTACLE_START: Point = [30, -82];
const LOOSE_OBJECT_SHOULDER = 3.5;
const PAD_WIDTH = 3;

interface Placement {
  readonly position: THREE.Vector3;
  readonly yaw: number;
}

function localFrame(model: THREE.Object3D): THREE.Matrix4 {
  model.updateMatrix();
  return model.matrix.clone().invert();
}

function modelYaw(model: THREE.Object3D): number {
  return new THREE.Euler().setFromQuaternion(model.quaternion, 'YXZ').y;
}

function localGeometry(
  geometry: THREE.BufferGeometry,
  toLocal: THREE.Matrix4,
  holder: THREE.Object3D,
): THREE.BufferGeometry {
  holder.updateMatrix();
  return geometry.applyMatrix4(holder.matrix.clone().invert().multiply(toLocal));
}

function placeAt(object: THREE.Object3D, { position, yaw }: Placement, toLocal: THREE.Matrix4, turn: number): void {
  const local = position.clone().applyMatrix4(toLocal);
  object.position.set(local.x, object.position.y, local.z);
  object.rotation.set(0, yaw - turn, 0, 'YXZ');
}

function placeOnGround(object: THREE.Object3D, placement: Placement, toLocal: THREE.Matrix4, turn: number): void {
  placeAt(object, placement, toLocal, turn);
  object.position.y = placement.position.clone().applyMatrix4(toLocal).y;
}

function sampleAt(samples: readonly TrackSample[], distance: number): TrackSample {
  const length = samples.length * SAMPLE_SPACING;
  const wrapped = ((distance % length) + length) % length;
  const sample = samples[Math.floor(wrapped / SAMPLE_SPACING)] ?? samples[0];
  if (!sample) throw new Error('트랙 샘플이 비어 있어요.');
  return sample;
}

function waterEntry(samples: readonly TrackSample[]): number {
  const entry = samples.find((sample, index) => {
    const previous = samples[(index - 1 + samples.length) % samples.length];
    return isOverWaterJump(sample.point) && previous !== undefined && !isOverWaterJump(previous.point);
  });
  if (!entry) throw new Error('트랙이 수로를 지나지 않아요.');
  return entry.distance;
}

function checkpointDistances(samples: readonly TrackSample[], start: number): number[] {
  const length = samples.length * SAMPLE_SPACING;
  const even = Array.from({ length: CHECKPOINT_COUNT }, (_, index) => start + (index * length) / CHECKPOINT_COUNT);
  const beforeJump = waterEntry(samples) - JUMP_RUN_UP;
  const isClear = (distance: number): boolean => !isOverWaterJump(sampleAt(samples, distance).point);
  return [...even.filter(isClear), beforeJump].sort(
    (a, b) => ((a - start + length) % length) - ((b - start + length) % length),
  );
}

function gatePlacement({ point, forward }: TrackSample): Placement {
  return { position: new THREE.Vector3(point[0], 0, point[1]), yaw: Math.atan2(-forward[0], -forward[1]) };
}

function shoulderPlacement({ point, forward }: TrackSample, side: number, offset: number): Placement {
  const [sideX, sideZ] = sideOf(forward);
  return {
    position: new THREE.Vector3(point[0] + sideX * side * offset, 0, point[1] + sideZ * side * offset),
    yaw: Math.atan2(forward[0], forward[1]),
  };
}

function rebuildRoad(model: THREE.Object3D, samples: readonly TrackSample[], toLocal: THREE.Matrix4): void {
  const road = model.children.find((child) => ROAD.test(child.name));
  if (!road) throw new Error('서킷 노면 충돌체를 찾지 못했어요.');
  for (const child of [...road.children]) child.removeFromParent();
  const half = TRACK.width / 2 + PAD_WIDTH;
  const surface = stripGeometry(samples, { from: { offset: -half, height: 0 }, to: { offset: half, height: 0 } });
  const collider = new THREE.Mesh(localGeometry(surface, toLocal, road));
  collider.name = 'trimeshRoad';
  road.add(collider);
}

function railsGeometry(samples: readonly TrackSample[]): THREE.BufferGeometry {
  const offset = TRACK.width / 2 + RAIL.gap;
  const walls = [-offset, offset].map((side) =>
    stripGeometry(samples, { from: { offset: side, height: 0 }, to: { offset: side, height: RAIL.height } }),
  );
  const positions = walls.flatMap((wall) => [...(wall.attributes.position?.array ?? [])]);
  const count = walls[0]?.attributes.position?.count ?? 0;
  const indices = walls.flatMap((wall, index) =>
    [...(wall.index?.array ?? [])].map((vertex) => vertex + index * count),
  );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function rebuildRails(model: THREE.Object3D, samples: readonly TrackSample[], toLocal: THREE.Matrix4): void {
  const rails = model.children.find((child) => RAILS.test(child.name));
  if (!(rails instanceof THREE.Mesh)) throw new Error('서킷 레일을 찾지 못했어요.');
  const geometry = localGeometry(railsGeometry(samples), toLocal, rails);
  rails.geometry = geometry;
  for (const child of rails.children) if (child instanceof THREE.Mesh) child.geometry = geometry.clone();
}

function rebuildCheckpoints(model: THREE.Object3D, samples: readonly TrackSample[], toLocal: THREE.Matrix4): void {
  for (const old of model.children.filter((child) => CHECKPOINT.test(child.name))) old.removeFromParent();
  const turn = modelYaw(model);
  const start = nearestSample(samples, AREA_ANCHORS.circuit.placed).distance;
  checkpointDistances(samples, start).forEach((distance, index) => {
    const gate = new THREE.Object3D();
    gate.name = `refCheckpoints${String(index).padStart(3, '0')}`;
    gate.scale.set(TRACK.width + CHECKPOINT_MARGIN, 1, 1);
    placeOnGround(gate, gatePlacement(sampleAt(samples, distance)), toLocal, turn);
    model.add(gate);
  });
}

function spreadObstacles(model: THREE.Object3D, samples: readonly TrackSample[], toLocal: THREE.Matrix4): void {
  const turn = modelYaw(model);
  const start = nearestSample(samples, OBSTACLE_START).distance;
  model.children
    .filter((child) => OBSTACLE.test(child.name))
    .forEach((obstacle, index) => {
      placeAt(obstacle, gatePlacement(sampleAt(samples, start + index * OBSTACLE_SPACING)), toLocal, turn);
    });
}

function spreadLooseObjects(model: THREE.Object3D, samples: readonly TrackSample[], toLocal: THREE.Matrix4): void {
  const turn = modelYaw(model);
  const objects = model.children.filter((child) => LOOSE_OBJECT.test(child.name));
  const length = samples.length * SAMPLE_SPACING;
  objects.forEach((object, index) => {
    const sample = sampleAt(samples, (index * length) / objects.length);
    const side = index % 2 === 0 ? 1 : -1;
    placeAt(object, shoulderPlacement(sample, side, TRACK.width / 2 + LOOSE_OBJECT_SHOULDER), toLocal, turn);
  });
}

export function layCircuitCourse(model: THREE.Object3D): void {
  for (const retired of model.children.filter((child) => RETIRED.test(child.name))) retired.removeFromParent();
  const samples = trackSamples(SAMPLE_SPACING);
  const toLocal = localFrame(model);
  rebuildRoad(model, samples, toLocal);
  rebuildRails(model, samples, toLocal);
  rebuildCheckpoints(model, samples, toLocal);
  spreadObstacles(model, samples, toLocal);
  spreadLooseObjects(model, samples, toLocal);
}

export function trackSideAt(position: THREE.Vector3): THREE.Vector3 {
  const { forward } = nearestSample(trackSamples(SAMPLE_SPACING), [position.x, position.z]);
  const [x, z] = sideOf(forward);
  return new THREE.Vector3(x, 0, z);
}
