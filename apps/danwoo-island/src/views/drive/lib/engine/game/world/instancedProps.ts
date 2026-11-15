import type * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { InstancedGroup, type InstanceReference } from '../instancedGroup';
import type { WorldObject } from '../objects';
import type { ColliderDescription, CollisionHandler } from '../physics/physics';

export interface InstancedPropsOptions {
  modelName: string;
  template: () => THREE.Object3D;
  prepareBase: (base: THREE.Object3D) => void;
  colliders: (base: THREE.Object3D) => readonly ColliderDescription[];
  contactThreshold: number;
  hasOwnShadows: boolean;
  onCollision?: CollisionHandler;
}

const PROP_PHYSICS = { friction: 0.7, mass: 0.1, waterGravityMultiplier: -1 } as const;
const TICK_ORDER = 10;

export function modelColliders(base: THREE.Object3D): readonly ColliderDescription[] {
  const [, physical] = getGame().objects.getFromModel(base, {}, {});
  return physical?.colliders ?? [];
}

interface PropItem {
  reference: InstanceReference;
  object: WorldObject;
}

export class InstancedProps {
  readonly instancedGroup: InstancedGroup;
  readonly #items: PropItem[];

  constructor({
    modelName,
    template,
    prepareBase,
    colliders,
    contactThreshold,
    hasOwnShadows,
    onCollision,
  }: InstancedPropsOptions) {
    const game = getGame();
    const [base, references] = InstancedGroup.getBaseAndReferencesFromInstances(game.model(modelName).scene.children);
    prepareBase(base);
    const baseColliders = colliders(base);
    game.materials.updateObject(base);

    const shadows = hasOwnShadows ? {} : { castShadow: false, receiveShadow: false };
    this.#items = references.map((reference) => ({
      reference,
      object: game.objects.add(
        { model: reference, updateMaterials: false, parent: null, ...shadows },
        {
          type: 'dynamic',
          position: reference.position,
          rotation: reference.quaternion,
          ...PROP_PHYSICS,
          sleeping: true,
          colliders: baseColliders,
          contactThreshold,
          onCollision,
        },
      ),
    }));
    this.instancedGroup = new InstancedGroup(references, template());
    game.ticker.events.on('tick', () => this.#markMoving(), TICK_ORDER);
  }

  #markMoving(): void {
    for (const { reference, object } of this.#items) {
      const body = object.physical?.body;
      if (body && !body.isSleeping() && body.isEnabled()) reference.needsUpdate = true;
    }
  }
}
