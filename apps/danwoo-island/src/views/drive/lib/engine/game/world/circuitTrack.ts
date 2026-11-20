import { color, float, Fn, mix, PI, positionWorld, step, texture, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { TRACK } from '@views/drive/lib/engine/game/world/layout/islandLayout';
import { trackSamples } from '@views/drive/lib/engine/game/world/layout/trackPath';
import { stripGeometry } from '@views/drive/lib/engine/game/world/trackGeometry';

const SAMPLE_SPACING = 1;
const ROAD_LIFT = 0.03;
const CURB = { width: 1.2, lift: 0.06, stripe: 2, red: '#e8473a', white: '#fff4ea' } as const;
const ROAD_COLOR = '#384246';
const GLITTER = { scarcity: 100, intensity: 0.3, perlin: 0.05, hash: 0.2, time: 0.004, view: 0.004 } as const;

function roadMaterial(glitterVariation: THREE.UniformNode<'float', number>): MeshDefaultMaterial {
  const { noises } = getGame();
  const colorNode = Fn(() => {
    const glitter = float(0);
    const hash = texture(noises.hash, positionWorld.xz.mul(GLITTER.hash))
      .r.mul(2)
      .add(glitterVariation)
      .mod(2)
      .sub(1)
      .abs();
    glitter.addAssign(hash);
    glitter.assign(glitter.pow(GLITTER.scarcity));
    glitter.mulAssign(GLITTER.intensity);
    glitter.mulAssign(texture(noises.perlin, positionWorld.xz.mul(GLITTER.perlin)).r);
    glitter.mulAssign(uv().y.mul(PI).sin());
    const baseColor = uniform(color(ROAD_COLOR)).rgb.toVar();
    baseColor.addAssign(glitter);
    return vec3(baseColor);
  })();
  return new MeshDefaultMaterial({ colorNode, hasLightBounce: false, hasWater: false });
}

function curbMaterial(): MeshDefaultMaterial {
  const stripe = step(
    0.5,
    uv()
      .x.div(CURB.stripe * 2)
      .fract(),
  );
  const colorNode = mix(color(CURB.red), color(CURB.white), stripe);
  return new MeshDefaultMaterial({ colorNode, hasLightBounce: false, hasWater: false });
}

function trackMesh(name: string, geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

export class CircuitTrack {
  readonly #glitterVariation = uniform(0);

  constructor() {
    const game = getGame();
    const samples = trackSamples(SAMPLE_SPACING);
    const half = TRACK.width / 2;
    const road = stripGeometry(samples, {
      from: { offset: -half, height: ROAD_LIFT },
      to: { offset: half, height: ROAD_LIFT },
    });
    const curbs = [
      [-half - CURB.width, -half],
      [half, half + CURB.width],
    ].map(([from = 0, to = 0]) =>
      stripGeometry(samples, { from: { offset: from, height: CURB.lift }, to: { offset: to, height: CURB.lift } }),
    );
    const material = curbMaterial();
    const meshes = [
      trackMesh('circuitRoad', road, roadMaterial(this.#glitterVariation)),
      ...curbs.map((geometry) => trackMesh('circuitCurb', geometry, material)),
    ];
    for (const mesh of meshes) game.objects.add({ model: mesh, updateMaterials: false, castShadow: false });
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.scenery);
  }

  update(): void {
    const { ticker, view } = getGame();
    this.#glitterVariation.value += ticker.deltaScaled * GLITTER.time + view.delta.length() * GLITTER.view;
  }
}
