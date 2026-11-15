import { InstancedProps, modelColliders } from './instancedProps';
import { createRopeFence } from './islandProps';

const TRAILING_NUMBER = /[0-9]+$/i;

export class Fences extends InstancedProps {
  constructor() {
    super({
      modelName: 'fencesModel',
      template: createRopeFence,
      prepareBase: (base) => {
        base.castShadow = true;
        base.receiveShadow = true;
        base.frustumCulled = true;
      },
      colliders: (base) => {
        const colliders = modelColliders(base);
        for (const child of base.children) child.name = child.name.replace(TRAILING_NUMBER, '');
        return colliders;
      },
      contactThreshold: 10,
      hasOwnShadows: true,
    });
  }
}
