import { Fn, texture, uniform, vec2 } from 'three/tsl';
import type * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import { TICK_ORDER } from './tickOrder';
import { remapClamp } from './utilities/maths';

type Vec2Node = THREE.Node<'vec2'>;

const ANGLE = Math.PI * 0.6;
const TIME_FREQUENCY = 0.1;
const NOISE = { coarseScale: 0.2, fineScale: 0.1, fineSpeed: 0.2, center: 0.5 } as const;

export class Wind {
  readonly angle = ANGLE;
  readonly direction = uniform(vec2(Math.sin(ANGLE), Math.cos(ANGLE)));
  readonly positionFrequency = uniform(0.5);
  readonly strength = uniform(0.5);
  readonly localTime = uniform(0);

  readonly offsetNode = Fn(([position]: [Vec2Node]): Vec2Node => {
    const { perlin } = getGame().noises;
    const scaled = position.mul(this.positionFrequency);
    const coarseUv = scaled.xy.mul(NOISE.coarseScale).add(this.direction.mul(this.localTime)).xy;
    const coarse = texture(perlin, coarseUv).r.sub(NOISE.center);
    const fineUv = scaled.xy.mul(NOISE.fineScale).add(this.direction.mul(this.localTime.mul(NOISE.fineSpeed))).xy;
    const fine = texture(perlin, fineUv).r.sub(NOISE.center);
    return vec2(this.direction.mul(fine.add(coarse)).mul(this.strength));
  });

  constructor() {
    getGame().ticker.events.on('tick', () => this.update(), TICK_ORDER.wind);
  }

  update(): void {
    const { weather, ticker } = getGame();
    this.strength.value = remapClamp(weather.wind.value, [0, 1], [0.1, 1]);
    this.localTime.value += ticker.deltaScaled * TIME_FREQUENCY * this.strength.value;
  }
}
