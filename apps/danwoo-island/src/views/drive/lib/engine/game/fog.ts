import { color, mix, rangeFogFactor, uniform, vec2, viewportUV } from 'three/tsl';

import { getGame } from './gameContext';

const TICK_ORDER = 10;

export class Fog {
  readonly game = getGame();
  readonly colorA = uniform(color('#ff0000'));
  readonly colorB = uniform(color('#0000ff'));
  readonly radialCenter = uniform(vec2(0, 0));
  readonly radialStart = uniform(0);
  readonly radialEnd = uniform(1);
  readonly color = mix(
    this.colorA,
    this.colorB,
    vec2(viewportUV.xy).sub(this.radialCenter).length().smoothstep(this.radialStart, this.radialEnd),
  );
  readonly near = uniform(this.game.view.optimalArea.nearDistance);
  readonly far = uniform(this.game.view.optimalArea.farDistance);
  readonly strength = rangeFogFactor(this.near, this.far);

  constructor() {
    this.game.scene.backgroundNode = this.color;
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  update(): void {
    const { nearDistance, farDistance } = this.game.view.optimalArea;
    const { dayCycles } = this.game;
    const amplitude = farDistance - nearDistance;
    this.colorA.value.copy(dayCycles.colorOf('fogColorA'));
    this.colorB.value.copy(dayCycles.colorOf('fogColorB'));
    this.near.value = nearDistance + dayCycles.numberOf('fogNearRatio') * amplitude;
    this.far.value = nearDistance + dayCycles.numberOf('fogFarRatio') * amplitude;
  }
}
