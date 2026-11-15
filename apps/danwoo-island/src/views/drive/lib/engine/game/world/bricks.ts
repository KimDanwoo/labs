import { getGame } from '../gameContext';
import { InstancedProps } from './instancedProps';
import { createFieldstone } from './islandProps';

const SCALE = 0.75;

export class Bricks extends InstancedProps {
  constructor() {
    super({
      modelName: 'bricksModel',
      template: createFieldstone,
      prepareBase: (base) => {
        base.castShadow = true;
        base.receiveShadow = true;
        base.frustumCulled = false;
      },
      colliders: () => [{ shape: 'cuboid', parameters: [0.75 * SCALE, 0.5 * SCALE, 1 * SCALE], category: 'object' }],
      contactThreshold: 15,
      hasOwnShadows: false,
      onCollision: (force, position) => getGame().audio.groups.get('hitBrick')?.playRandomNext(force, position),
    });
  }
}
