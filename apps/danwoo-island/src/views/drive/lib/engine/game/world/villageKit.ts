import * as THREE from 'three/webgpu';

import { createParts, type PartName, type Parts, type PartTransform } from './islandGeometry';

export interface PropFrame {
  readonly isTube: boolean;
  readonly size: THREE.Vector3;
  readonly radius: number;
  readonly height: number;
  readonly matrix: THREE.Matrix4;
}

export interface ReferenceSpot {
  readonly center: THREE.Vector3;
  readonly bottom: number;
}

export type Profile = readonly (readonly [number, number])[];

export type PropBuilder = (parts: Parts, container: THREE.Object3D) => void;

const COLLIDER = /^(cuboid|hull|trimesh|tube|ball)/i;
const REFERENCE = /^ref/i;
const EMISSIVE = /^emissive/;
const TUBE = /^tube/i;
const UNIT_SCALE = new THREE.Vector3(1, 1, 1);

function hasReference(object: THREE.Object3D): boolean {
  let isFound = false;
  object.traverse((child) => {
    if (child !== object && REFERENCE.test(child.name)) isFound = true;
  });
  return isFound;
}

function materialName(mesh: THREE.Mesh): string {
  return Array.isArray(mesh.material) ? '' : mesh.material.name;
}

function isReplaceable(child: THREE.Object3D, keepEmissive: boolean): boolean {
  if (
    !(child instanceof THREE.Mesh) ||
    COLLIDER.test(child.name) ||
    REFERENCE.test(child.name) ||
    hasReference(child)
  ) {
    return false;
  }
  return !(keepEmissive && EMISSIVE.test(materialName(child)));
}

export function prepare(
  target: THREE.Object3D,
  { keepEmissive = true }: { keepEmissive?: boolean } = {},
): THREE.Object3D {
  let container = target;
  if (target instanceof THREE.Mesh) {
    container = new THREE.Object3D();
    container.name = target.name;
    container.position.copy(target.position);
    container.quaternion.copy(target.quaternion);
    container.scale.copy(target.scale);
    container.userData = { ...target.userData };
    for (const child of [...target.children]) container.add(child);
    target.parent?.add(container);
    target.removeFromParent();
  }
  for (const child of container.children.filter((item) => isReplaceable(item, keepEmissive))) child.removeFromParent();
  return container;
}

function frameOf(collider: THREE.Object3D): PropFrame {
  return {
    isTube: TUBE.test(collider.name),
    size: collider.scale.clone(),
    radius: collider.scale.x / 2,
    height: collider.scale.y,
    matrix: new THREE.Matrix4().compose(collider.position, collider.quaternion, UNIT_SCALE),
  };
}

export function collidersOf(container: THREE.Object3D): PropFrame[] {
  return container.children.filter((child) => COLLIDER.test(child.name)).map(frameOf);
}

export function firstCollider(container: THREE.Object3D): PropFrame {
  const [frame] = collidersOf(container);
  if (!frame) throw new Error(`소품 ${container.name}에 충돌체가 없어요.`);
  return frame;
}

export function boundsFrame(target: THREE.Mesh): PropFrame {
  target.geometry.computeBoundingBox();
  const box = target.geometry.boundingBox ?? new THREE.Box3();
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return {
    isTube: false,
    size,
    radius: Math.min(size.x, size.z) / 2,
    height: size.y,
    matrix: new THREE.Matrix4().makeTranslation(center),
  };
}

export function referenceCenter(container: THREE.Object3D, pattern: RegExp): ReferenceSpot[] {
  const centers: ReferenceSpot[] = [];
  container.updateMatrixWorld(true);
  const inverse = container.matrixWorld.clone().invert();
  container.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !pattern.test(child.name)) return;
    child.geometry.computeBoundingBox();
    const bounds = child.geometry.boundingBox;
    if (!bounds) return;
    const box = bounds.clone().applyMatrix4(child.matrixWorld).applyMatrix4(inverse);
    centers.push({ center: box.getCenter(new THREE.Vector3()), bottom: box.min.y });
  });
  return centers;
}

export function lathe(parts: Parts, name: PartName, profile: Profile, transform: PartTransform, segments = 10): void {
  parts.add(
    name,
    new THREE.LatheGeometry(
      profile.map(([x, y]) => new THREE.Vector2(x, y)),
      segments,
    ),
    transform,
  );
}

export function scaleProfile(
  profile: Profile,
  { radius, bottom, height }: { radius: number; bottom: number; height: number },
): Profile {
  return profile.map(([ratio, level]) => [radius * ratio, bottom + height * level] as const);
}

export function rebuildChild(
  child: THREE.Object3D,
  { build, keepEmissive = true }: { build: PropBuilder; keepEmissive?: boolean },
): void {
  const container = prepare(child, { keepEmissive });
  const parts = createParts();
  build(parts, container);
  container.add(parts.build());
}
