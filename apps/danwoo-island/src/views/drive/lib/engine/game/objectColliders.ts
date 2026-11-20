import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type {
  BodyType,
  ColliderDescription,
  CollisionCategory,
  Physical,
  PhysicalDescription,
  ShapeParameters,
} from '@views/drive/lib/engine/game/physics/physicsTypes';
import * as THREE from 'three/webgpu';

export interface VisualDescription {
  model?: THREE.Object3D;
  updateMaterials?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  parent?: THREE.Object3D | null;
}

export interface ObjectVisual {
  object3D: THREE.Object3D;
  parent: THREE.Object3D | null;
}

export interface WorldObject {
  visual: ObjectVisual | null;
  physical: Physical | null;
  needsUpdate: boolean;
  isResetting: boolean;
}

export type ModelPhysicalDescription = Omit<PhysicalDescription, 'colliders'>;
export const markInstanceDirty = (object3D: THREE.Object3D): void => {
  if ('needsUpdate' in object3D) object3D.needsUpdate = true;
};
export const PHYSICAL_PATTERN = /physical/i;
export const BODY_TYPE_TAGS = /physical|fixed|dynamic|kinematicPositionBased/gi;
const BODY_TYPE_BY_TAG: readonly [RegExp, BodyType][] = [
  [/dynamic/i, 'dynamic'],
  [/kinematicPositionBased/i, 'kinematicPositionBased'],
];
const CATEGORIES = new Set<string>(['floor', 'object', 'bumper']);
const ZERO = { x: 0, y: 0, z: 0 };
const COLLIDER_BY_PREFIX: readonly [RegExp, (child: THREE.Object3D) => ShapeParameters | null][] = [
  [/^trimesh/i, (child) => meshCollider(child, 'trimesh')],
  [/^hull/i, (child) => meshCollider(child, 'hull')],
  [/^cuboid/i, ({ scale }) => ({ shape: 'cuboid', parameters: [scale.x * 0.5, scale.y * 0.5, scale.z * 0.5] })],
  [/^tube/i, ({ scale }) => ({ shape: 'cylinder', parameters: [scale.y * 0.5, scale.x * 0.5] })],
  [/^ball/i, ({ scale }) => ({ shape: 'ball', parameters: [scale.y * 0.5] })],
];
function meshCollider(child: THREE.Object3D, shape: 'trimesh' | 'hull'): ShapeParameters | null {
  if (!(child instanceof THREE.Mesh)) return null;
  const positions = child.geometry.attributes.position?.array;
  if (!(positions instanceof Float32Array)) return null;
  if (shape === 'hull') return { shape, parameters: [positions] };
  const indices = child.geometry.index?.array;
  if (!indices) return null;
  return { shape, parameters: [positions, Uint32Array.from(indices)] };
}
function numberData(object: THREE.Object3D, key: string): number | undefined {
  const value: unknown = object.userData[key];
  return typeof value === 'number' ? value : undefined;
}
function isCategory(value: unknown): value is CollisionCategory {
  return typeof value === 'string' && CATEGORIES.has(value);
}
function categoryData(object: THREE.Object3D): CollisionCategory | undefined {
  const value: unknown = object.userData.category;
  return isCategory(value) ? value : undefined;
}
export function surfaceOverrides(
  object: THREE.Object3D,
): Pick<ColliderDescription, 'restitution' | 'friction' | 'category'> {
  const overrides: Pick<ColliderDescription, 'restitution' | 'friction' | 'category'> = {};
  const restitution = numberData(object, 'restitution');
  const friction = numberData(object, 'friction');
  const category = categoryData(object);
  if (restitution !== undefined) overrides.restitution = restitution;
  if (friction !== undefined) overrides.friction = friction;
  if (category !== undefined) overrides.category = category;
  return overrides;
}
export function bodyTypeFromName(name: string): BodyType {
  return BODY_TYPE_BY_TAG.find(([pattern]) => pattern.test(name))?.[1] ?? 'fixed';
}
function childCollider(child: THREE.Object3D): ColliderDescription | null {
  const build = COLLIDER_BY_PREFIX.find(([pattern]) => pattern.test(child.name))?.[1];
  const shape = build?.(child);
  if (!shape) return null;
  return { ...shape, position: child.position, quaternion: child.quaternion, ...surfaceOverrides(child) };
}
export function extractColliders(model: THREE.Object3D): ColliderDescription[] {
  const colliders: ColliderDescription[] = [];
  for (const child of [...model.children]) {
    const collider = childCollider(child);
    if (!collider) continue;
    colliders.push(collider);
    child.removeFromParent();
  }
  return colliders;
}
export function prepareModel(
  model: THREE.Object3D,
  { updateMaterials, castShadow, receiveShadow }: VisualDescription,
): void {
  if (updateMaterials) getGame().materials.updateObject(model);
  const isShadowless = !castShadow && !receiveShadow;
  if (isShadowless) return;
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const shouldCastShadow = castShadow && !child.userData.preventShadow;
    if (shouldCastShadow) child.castShadow = true;
    if (receiveShadow) child.receiveShadow = true;
  });
}
export function isStatic(description: PhysicalDescription, physical: Physical): boolean {
  return Boolean(description.sleeping) || !description.enabled || physical.type === 'fixed';
}
export function stopBody({ body }: Physical): void {
  body.setLinvel(ZERO, false);
  body.setAngvel(ZERO, false);
  body.resetForces(false);
  body.resetTorques(false);
}
function isWorldObject(value: unknown): value is WorldObject {
  return typeof value === 'object' && value !== null && 'physical' in value && 'visual' in value;
}

export function objectOf(object3D: THREE.Object3D): WorldObject {
  const object: unknown = object3D.userData.object;
  if (!isWorldObject(object)) throw new Error(`Object3D has no world object: ${object3D.name}`);
  return object;
}
