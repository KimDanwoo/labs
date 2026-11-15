import { InstancedProps, modelColliders } from './instancedProps';
import { createBeachBench } from './islandProps';

export class Benches extends InstancedProps {
  constructor() {
    super({
      modelName: 'benchesModel',
      template: createBeachBench,
      prepareBase: (base) => {
        base.castShadow = true;
        base.receiveShadow = true;
        base.frustumCulled = true;
      },
      colliders: modelColliders,
      contactThreshold: 10,
      hasOwnShadows: true,
    });
  }
}
