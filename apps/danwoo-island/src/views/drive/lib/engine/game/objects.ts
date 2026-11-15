import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import type {
  BodyType,
  ColliderDescription,
  CollisionCategory,
  Physical,
  PhysicalDescription,
  ShapeParameters,
} from './physics/physics';

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

const TICK_ORDER = 4;

const markInstanceDirty = (object3D: THREE.Object3D): void => {
  if ('needsUpdate' in object3D) object3D.needsUpdate = true;
};
const PHYSICAL_PATTERN = /physical/i;
const BODY_TYPE_TAGS = /physical|fixed|dynamic|kinematicPositionBased/gi;
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

function surfaceOverrides(object: THREE.Object3D): Pick<ColliderDescription, 'restitution' | 'friction' | 'category'> {
  const overrides: Pick<ColliderDescription, 'restitution' | 'friction' | 'category'> = {};
  const restitution = numberData(object, 'restitution');
  const friction = numberData(object, 'friction');
  const category = categoryData(object);
  if (restitution !== undefined) overrides.restitution = restitution;
  if (friction !== undefined) overrides.friction = friction;
  if (category !== undefined) overrides.category = category;
  return overrides;
}

function bodyTypeFromName(name: string): BodyType {
  return BODY_TYPE_BY_TAG.find(([pattern]) => pattern.test(name))?.[1] ?? 'fixed';
}

function childCollider(child: THREE.Object3D): ColliderDescription | null {
  const build = COLLIDER_BY_PREFIX.find(([pattern]) => pattern.test(child.name))?.[1];
  const shape = build?.(child);
  if (!shape) return null;
  return { ...shape, position: child.position, quaternion: child.quaternion, ...surfaceOverrides(child) };
}

function extractColliders(model: THREE.Object3D): ColliderDescription[] {
  const colliders: ColliderDescription[] = [];
  for (const child of [...model.children]) {
    const collider = childCollider(child);
    if (!collider) continue;
    colliders.push(collider);
    child.removeFromParent();
  }
  return colliders;
}

function prepareModel(model: THREE.Object3D, { updateMaterials, castShadow, receiveShadow }: VisualDescription): void {
  if (updateMaterials) getGame().materials.updateObject(model);
  if (!castShadow && !receiveShadow) return;
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (castShadow && !child.userData.preventShadow) child.castShadow = true;
    if (receiveShadow) child.receiveShadow = true;
  });
}

function isStatic(description: PhysicalDescription, physical: Physical): boolean {
  return Boolean(description.sleeping) || !description.enabled || physical.type === 'fixed';
}

function stopBody({ body }: Physical): void {
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

export class Objects {
  readonly list = new Map<number, WorldObject>();
  #key = 0;
  readonly #roundedView = { x: 0, z: 0 };

  constructor() {
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  add(
    visualDescription: VisualDescription | null = null,
    physicalDescription: PhysicalDescription | null = null,
  ): WorldObject {
    const object: WorldObject = { visual: null, physical: null, needsUpdate: false, isResetting: false };

    if (visualDescription?.model) object.visual = this.#createVisual(visualDescription.model, visualDescription);
    if (physicalDescription) {
      object.physical = getGame().physics.getPhysical(physicalDescription);
      object.physical.body.userData = { object };
    }
    if (object.visual) object.visual.object3D.userData.object = object;

    this.#key += 1;
    this.list.set(this.#key, object);

    const { visual, physical } = object;
    if (visual && physical && physicalDescription && isStatic(physicalDescription, physical)) {
      visual.object3D.position.copy(physical.body.translation());
      visual.object3D.quaternion.copy(physical.body.rotation());
    }
    return object;
  }

  #createVisual(model: THREE.Object3D, description: VisualDescription): ObjectVisual {
    const options = {
      updateMaterials: true,
      castShadow: true,
      receiveShadow: true,
      parent: getGame().scene,
      ...description,
    };
    prepareModel(model, options);
    options.parent?.add(model);
    return { object3D: model, parent: options.parent };
  }

  getFromModel(
    model: THREE.Object3D,
    visualDescription: VisualDescription = {},
    physicalDescription: ModelPhysicalDescription = {},
  ): [VisualDescription, PhysicalDescription | null] {
    const visual = { ...visualDescription, model };
    if (!PHYSICAL_PATTERN.test(model.name)) return [visual, null];

    const description: PhysicalDescription = {
      ...physicalDescription,
      type: physicalDescription.type ?? bodyTypeFromName(model.name),
      ...surfaceOverrides(model),
      colliders: [],
    };
    model.name = model.name.replaceAll(BODY_TYPE_TAGS, '');
    return [visual, { ...description, colliders: extractColliders(model) }];
  }

  addFromModel(
    model: THREE.Object3D,
    visualDescription: VisualDescription = {},
    physicalDescription: ModelPhysicalDescription = {},
  ): WorldObject {
    return this.add(...this.getFromModel(model, visualDescription, physicalDescription));
  }

  resetObject(object: WorldObject): void {
    const { physical, visual } = object;
    if (!physical || object.isResetting) return;
    if (physical.type !== 'dynamic' && physical.type !== 'kinematicPositionBased') return;

    object.isResetting = true;
    const { body, initialState } = physical;
    const wasEnabled = body.isEnabled();
    body.setEnabled(false);
    body.setTranslation(initialState.position, false);
    body.setRotation(initialState.rotation, false);
    stopBody(physical);

    const { ticker } = getGame();
    ticker.wait(1, () => {
      body.setEnabled(wasEnabled);
      if (initialState.sleeping) body.sleep();
      object.isResetting = false;
      ticker.wait(1, () => {
        object.needsUpdate = true;
      });
    });

    if (!visual) return;
    if (visual.parent && visual.parent !== visual.object3D.parent) visual.parent.add(visual.object3D);
    visual.object3D.position.copy(initialState.position);
    visual.object3D.quaternion.copy(initialState.rotation);
    markInstanceDirty(visual.object3D);
  }

  resetAll(): void {
    for (const object of this.list.values()) this.resetObject(object);
  }

  disable({ physical, visual }: WorldObject): void {
    if (physical) {
      stopBody(physical);
      physical.body.setEnabled(false);
    }
    visual?.object3D.removeFromParent();
  }

  enable({ physical, visual }: WorldObject): void {
    physical?.body.setEnabled(true);
    if (visual && visual.parent !== visual.object3D.parent) visual.parent?.add(visual.object3D);
  }

  readonly #awake = new WeakSet<WorldObject>();

  update(): void {
    const game = getGame();
    const { focusPoint, optimalArea } = game.view;
    const roundedX = Math.round(focusPoint.position.x);
    const roundedZ = Math.round(focusPoint.position.z);
    const hasViewMoved = roundedX !== this.#roundedView.x || roundedZ !== this.#roundedView.z;
    this.#roundedView.x = roundedX;
    this.#roundedView.z = roundedZ;

    for (const object of this.list.values()) {
      const { physical, visual } = object;
      if (!physical) continue;
      const { body } = physical;
      const isResting = body.isSleeping() || !body.isEnabled();
      const wasAwake = this.#awake.has(object);
      if (isResting) this.#awake.delete(object);
      else this.#awake.add(object);
      if (isResting && !object.needsUpdate && !wasAwake) continue;
      const position = body.translation();

      if (visual && (object.needsUpdate || wasAwake || !isResting)) {
        object.needsUpdate = false;
        visual.object3D.position.copy(position);
        visual.object3D.quaternion.copy(body.rotation());
        markInstanceDirty(visual.object3D);
      }
      if (position.y < game.water.depthElevation) this.resetObject(object);
      if (!hasViewMoved) continue;

      const distanceToView = Math.hypot(roundedX - position.x, roundedZ - position.z);
      if (body.isEnabled() && !body.isSleeping() && distanceToView > optimalArea.radius) body.sleep();
    }
  }
}
