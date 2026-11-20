import type { Parts, Triple } from '@views/drive/lib/engine/game/world/islandGeometry';
import type { PartName } from '@views/drive/lib/engine/game/world/islandMaterials';
import { islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import * as THREE from 'three/webgpu';

export interface Frame {
  readonly size: THREE.Vector3;
  readonly matrix: THREE.Matrix4;
}
interface Roof {
  readonly center: Triple;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
}
interface Pillar {
  readonly x: number;
  readonly z: number;
  readonly bottom: number;
  readonly top: number;
  readonly radius?: number;
}
const UNIT_SCALE = new THREE.Vector3(1, 1, 1);
export const CUBOID = /^cuboid/;
const COLLIDER_NAME = /^(cuboid|hull|trimesh|tube|ball)/i;
export function cuboidFrame(cuboid: THREE.Object3D): Frame {
  return {
    size: cuboid.scale.clone(),
    matrix: new THREE.Matrix4().compose(cuboid.position, cuboid.quaternion, UNIT_SCALE),
  };
}
export function findChild(parent: THREE.Object3D, name: string): THREE.Object3D {
  const child = parent.children.find((item) => item.name === name);
  if (!child) throw new Error(`월드 모델에서 ${name}을 찾지 못했어요.`);
  return child;
}
export function findChildMatching(parent: THREE.Object3D, pattern: RegExp): THREE.Object3D {
  const child = parent.children.find((item) => pattern.test(item.name));
  if (!child) throw new Error(`월드 모델에서 ${pattern.source}을 찾지 못했어요.`);
  return child;
}
export function requireMesh(object: THREE.Object3D): THREE.Mesh {
  if (!(object instanceof THREE.Mesh)) throw new Error(`월드 모델 ${object.name}이 메시가 아니에요.`);
  return object;
}
export function swapForGroup(target: THREE.Object3D): THREE.Object3D {
  const replacement = new THREE.Object3D();
  replacement.name = target.name;
  replacement.position.copy(target.position);
  replacement.quaternion.copy(target.quaternion);
  replacement.scale.copy(target.scale);
  replacement.userData = { ...target.userData };
  for (const child of [...target.children]) replacement.add(child);
  target.parent?.add(replacement);
  target.removeFromParent();
  return replacement;
}
export function replaceVisual(
  parent: THREE.Object3D,
  name: string,
  build: (container: THREE.Object3D) => THREE.Object3D,
): THREE.Object3D {
  const target = findChild(parent, name);
  const container = target instanceof THREE.Mesh ? swapForGroup(target) : target;
  container.add(build(container));
  return container;
}
const ROOF_OVERHANG = 1.04;
export function palmRoof({ center, width, depth, height }: Roof): THREE.Mesh {
  const [x, y, z] = center;
  const matrix = new THREE.Matrix4().makeTranslation(x, y + height / 2, z);
  return islandModelMesh('palmRoof', matrix, new THREE.Vector3(width * ROOF_OVERHANG, height, depth * ROOF_OVERHANG));
}
export function pillar(parts: Parts, material: PartName, { x, z, bottom, top, radius = 0.2 }: Pillar): void {
  parts.box('stone', [radius * 3, 0.28, radius * 3], { position: [x, bottom + 0.14, z] });
  parts.prism(material, radius, radius * 1.05, top - bottom - 0.28, { position: [x, (bottom + 0.28 + top) / 2, z] });
}
export function removeVisualMeshes(container: THREE.Object3D): void {
  for (const child of container.children.filter(
    (item) => item instanceof THREE.Mesh && !COLLIDER_NAME.test(item.name),
  )) {
    child.removeFromParent();
  }
}
