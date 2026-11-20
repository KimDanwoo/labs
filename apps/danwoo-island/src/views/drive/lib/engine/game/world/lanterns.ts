import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { InstancedProps } from '@views/drive/lib/engine/game/world/instancedProps';
import { createGardenLamp } from '@views/drive/lib/engine/game/world/islandProps';

const TRAILING_NUMBER = /[0-9]+$/i;
const SCALE = 0.5;

export class Lanterns extends InstancedProps {
  constructor() {
    super({
      modelName: 'lanternsModel',
      template: createGardenLamp,
      prepareBase: (base) => {
        for (const child of base.children) {
          child.name = child.name.replace(TRAILING_NUMBER, '');
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;
        }
      },
      colliders: () => [{ shape: 'cuboid', parameters: [0.7 * SCALE, 1 * SCALE, 0.7 * SCALE], category: 'object' }],
      contactThreshold: 10,
      hasOwnShadows: false,
      onCollision: (force, position) => getGame().audio.groups.get('hitBrick')?.playRandomNext(force, position),
    });
  }
}
