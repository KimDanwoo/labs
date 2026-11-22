import { color, max, mix, positionWorld, rangeFogFactor, uniform, vec2, viewportUV } from 'three/tsl';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

const FLIGHT_FOG_PUSH = 1.3;
const AREA_EDGE = { start: 0.72, end: 0.97 } as const;

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
  readonly areaCenter = uniform(vec2(0, 0));
  readonly areaRadius = uniform(this.game.view.optimalArea.radius);
  readonly strength = max(
    rangeFogFactor(this.near, this.far),
    positionWorld.xz
      .sub(this.areaCenter)
      .length()
      .smoothstep(this.areaRadius.mul(AREA_EDGE.start), this.areaRadius.mul(AREA_EDGE.end)),
  );

  constructor() {
    this.game.scene.backgroundNode = this.color;
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER.fog);
  }

  update(): void {
    const { nearDistance, farDistance, radius, position } = this.game.view.optimalArea;
    const { dayCycles, view } = this.game;
    const amplitude = farDistance - nearDistance;
    const lift = view.flightLift * FLIGHT_FOG_PUSH;
    this.areaCenter.value.set(position.x, position.z);
    this.areaRadius.value = radius;
    this.colorA.value.copy(dayCycles.colorOf('fogColorA'));
    this.colorB.value.copy(dayCycles.colorOf('fogColorB'));
    this.near.value = nearDistance + lift + dayCycles.numberOf('fogNearRatio') * amplitude;
    this.far.value = nearDistance + lift + dayCycles.numberOf('fogFarRatio') * amplitude;
  }
}
