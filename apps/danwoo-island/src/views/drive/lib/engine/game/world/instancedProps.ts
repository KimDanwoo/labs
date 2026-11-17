import type * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { InstancedGroup } from '../instancedGroup';
import type { ColliderDescription, CollisionHandler } from '../physics/physics';
import { pushOutOfShowerBay } from './showerBay';

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

export class InstancedProps {
  readonly instancedGroup: InstancedGroup;

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
    for (const reference of references) {
      pushOutOfShowerBay(reference.position);
      game.objects.add(
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
      );
    }
    this.instancedGroup = new InstancedGroup(references, template());
  }
}
