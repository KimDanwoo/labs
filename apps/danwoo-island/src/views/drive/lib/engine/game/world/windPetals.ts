import { attribute, color, Fn, mix, mod, positionGeometry, rotate, sin, step, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { BLOSSOMS } from '@views/drive/lib/engine/game/world/flowers';

const COUNT = 80;
const PETAL = { width: 0.34, length: 0.2 } as const;
const PETAL_CORNERS = [
  [-PETAL.width / 2, 0],
  [-PETAL.width / 4, -PETAL.length / 2],
  [PETAL.width / 4, -PETAL.length / 2],
  [PETAL.width / 2, 0],
  [PETAL.width / 4, PETAL.length / 2],
  [-PETAL.width / 4, PETAL.length / 2],
] as const;
const PETAL_INDICES = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5] as const;
const TAU = Math.PI * 2;
const DRIFT_SPEED = 25;
const SPIN_SPEED = 2.4;
const TUMBLE_RATIO = 0.7;
const FLUTTER = { speed: 1.6, amplitude: 0.35 } as const;
const ELEVATION = { min: 0.6, range: 2.2 } as const;
const EDGE_FADE = 0.35;
const AREA_RATIO = 2;
const COLOR_STEPS = [0.25, 0.5, 0.75] as const;

function petalGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(COUNT * PETAL_CORNERS.length * 3);
  const seeds = new Float32Array(COUNT * PETAL_CORNERS.length * 4);
  const indices = new Uint16Array(COUNT * PETAL_INDICES.length);

  for (let petal = 0; petal < COUNT; petal += 1) {
    const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
    for (const [corner, [x, z]] of PETAL_CORNERS.entries()) {
      const vertex = petal * PETAL_CORNERS.length + corner;
      positions.set([x, 0, z], vertex * 3);
      seeds.set(seed, vertex * 4);
    }
    indices.set(
      PETAL_INDICES.map((corner) => petal * PETAL_CORNERS.length + corner),
      petal * PETAL_INDICES.length,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 4));
  geometry.index = new THREE.Uint16BufferAttribute(indices, 1);
  return geometry;
}

function petalColor(): THREE.Node<'vec3'> {
  const pick = attribute('seed', 'vec4').w;
  const [first, second, third] = COLOR_STEPS;
  const warm = mix(color(BLOSSOMS.hibiscus), color(BLOSSOMS.orchid), step(first, pick));
  const pale = mix(color(BLOSSOMS.plumeria), color(BLOSSOMS.allamanda), step(third, pick));
  return mix(warm, pale, step(second, pick)).rgb;
}

export class WindPetals {
  constructor() {
    const game = getGame();
    const mesh = new THREE.Mesh(petalGeometry(), this.#material());
    mesh.frustumCulled = false;
    game.scene.add(mesh);
  }

  #material(): MeshDefaultMaterial {
    const { view, wind, ticker } = getGame();
    const material = new MeshDefaultMaterial({
      side: THREE.DoubleSide,
      colorNode: petalColor(),
      normalNode: vec3(0, 1, 0),
      hasCoreShadows: false,
      hasDropShadows: false,
      hasLightBounce: false,
      hasWater: false,
    });
    const center = uniform(view.optimalArea.position);
    const size = uniform(view.optimalArea.radius * AREA_RATIO);
    material.positionNode = Fn(() => {
      const seed = attribute('seed', 'vec4');
      const time = ticker.elapsedScaledUniform;
      const spin = time.mul(SPIN_SPEED).add(seed.z.mul(TAU));
      const corner = rotate(positionGeometry, vec3(spin, spin.mul(TUMBLE_RATIO), seed.w.mul(TAU)));

      const halfSize = size.mul(0.5);
      const drift = wind.direction.mul(wind.localTime.mul(DRIFT_SPEED));
      const offset = mod(seed.xy.mul(size).add(drift).sub(center.xz).add(halfSize), size).sub(halfSize);
      const fade = offset.length().div(halfSize).oneMinus().smoothstep(0, EDGE_FADE);

      const flutter = sin(time.mul(FLUTTER.speed).add(seed.w.mul(TAU))).mul(FLUTTER.amplitude);
      const elevation = center.y.add(ELEVATION.min).add(seed.z.mul(ELEVATION.range)).add(flutter);
      return vec3(center.x.add(offset.x), elevation, center.z.add(offset.y)).add(corner.mul(fade));
    })();
    return material;
  }
}
