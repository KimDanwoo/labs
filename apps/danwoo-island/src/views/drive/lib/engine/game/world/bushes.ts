import { color, uniform } from 'three/tsl';

import { getGame } from '../gameContext';
import { Foliage } from './foliage';

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
