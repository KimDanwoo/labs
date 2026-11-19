import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import {
  BODY_TYPE_TAGS,
  type ModelPhysicalDescription,
  type ObjectVisual,
  PHYSICAL_PATTERN,
  type VisualDescription,
  type WorldObject,
  bodyTypeFromName,
  extractColliders,
  isStatic,
  markInstanceDirty,
  prepareModel,
  stopBody,
  surfaceOverrides,
} from './objectColliders';
import type { PhysicalDescription } from './physics/physicsTypes';
import { TICK_ORDER } from './tickOrder';

export class Objects {
  readonly list = new Map<number, WorldObject>();
  #key = 0;
  readonly #roundedView = { x: 0, z: 0 };

  constructor() {
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER.objects);
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
