import { color, uniform } from 'three/tsl';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { Foliage } from '@views/drive/lib/engine/game/world/foliage';

export class Bushes {
  readonly foliage: Foliage;

  constructor() {
    this.foliage = new Foliage({
      references: getGame().model('bushesReferences').scene.children,
      colorA: uniform(color('#438a50')),
      colorB: uniform(color('#91c85c')),
    });
  }
}
