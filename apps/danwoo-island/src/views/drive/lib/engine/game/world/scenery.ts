import { color, float, Fn, PI, positionWorld, texture, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { References } from '../references';
import { paintSteppingStones } from './islandReskins';
import { rebuildBridge } from './islandStructures';

const BRIDGE_PATTERN = /^bridgePhysicalFixed/;
const GLITTER_SPEED = { time: 0.004, view: 0.004 } as const;

export class Scenery {
  readonly references = new References();
  readonly #glitterVariation = uniform(0);

  constructor() {
    const game = getGame();
    const { scene } = game.model('sceneryModel');
    for (const bridge of [...scene.children].filter((child) => BRIDGE_PATTERN.test(child.name))) {
      rebuildBridge(bridge, game.materials);
    }
    paintSteppingStones(scene);

    for (const child of [...scene.children]) {
      const prevent: unknown = child.userData.prevent;
      if (prevent === undefined || prevent === false) {
        const mass: unknown = child.userData.mass;
        game.objects.addFromModel(
          child,
          {},
          {
            position: child.position,
            rotation: child.quaternion,
            sleeping: true,
            mass: typeof mass === 'number' ? mass : undefined,
          },
        );
      }
      this.references.parse(child);
    }
    this.#paintRoad();
    game.ticker.events.on('tick', () => this.update());
  }

  #paintRoad(): void {
    const { noises } = getGame();
    const road = this.references.items.get('road')?.[0];
    if (!(road instanceof THREE.Mesh)) throw new Error('Scenery road is missing');

    const roadColor = uniform(color('#384246'));
    const scarcity = uniform(100);
    const intensity = uniform(0.3);
    const perlinFrequency = uniform(0.05);
    const hashFrequency = uniform(0.2);
    const colorNode = Fn(() => {
      const glitter = float(0);
      const hash = texture(noises.hash, positionWorld.xz.mul(hashFrequency))
        .r.mul(2)
        .add(this.#glitterVariation)
        .mod(2)
        .sub(1)
        .abs();
      glitter.addAssign(hash);
      glitter.assign(glitter.pow(scarcity));
      glitter.mulAssign(intensity);
      glitter.mulAssign(texture(noises.perlin, positionWorld.xz.mul(perlinFrequency)).r);
      glitter.mulAssign(uv().y.mul(PI).sin());
      const baseColor = roadColor.rgb.toVar();
      baseColor.addAssign(glitter);
      return vec3(baseColor);
    })();
    road.material = new MeshDefaultMaterial({ colorNode, hasLightBounce: false, hasWater: false });
  }

  update(): void {
    const { ticker, view } = getGame();
    this.#glitterVariation.value += ticker.deltaScaled * GLITTER_SPEED.time + view.delta.length() * GLITTER_SPEED.view;
  }
}
