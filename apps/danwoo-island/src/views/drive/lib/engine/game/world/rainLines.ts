import { attribute, Fn, fract, mod, step, uniform, vec2, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { lerp, remapClamp } from '../utilities/maths';

const COUNT = 2 ** 11;
const VERTICES_PER_LINE = 4;
const LINE_INDICES = [0, 3, 2, 2, 1, 0] as const;
const SNOW = { length: 0.03, speed: 0.05 } as const;
const MIN_VISIBLE_RATIO = 0.00001;
const HIDDEN_LIFT = 99;
const MESH_OFFSET_Y = -0.3;
const TICK_ORDER = 10;
const THROTTLE_ORDER = 2;

function lineGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(COUNT * VERTICES_PER_LINE * 3);
  const offsets = new Float32Array(COUNT * VERTICES_PER_LINE * 2);
  const randoms = new Float32Array(COUNT * VERTICES_PER_LINE);
  const indices = new Uint16Array(COUNT * LINE_INDICES.length);

  for (let line = 0; line < COUNT; line += 1) {
    const x = Math.random();
    const z = Math.random();
    const random = Math.random();
    for (let corner = 0; corner < VERTICES_PER_LINE; corner += 1) {
      const vertex = line * VERTICES_PER_LINE + corner;
      positions.set([x, 0, z], vertex * 3);
      offsets.set([corner === 0 || corner === 1 ? 1 : 0, corner === 0 || corner === 3 ? 1 : 0], vertex * 2);
      randoms[vertex] = random;
    }
    indices.set(
      LINE_INDICES.map((corner) => line * VERTICES_PER_LINE + corner),
      line * LINE_INDICES.length,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('offset', new THREE.Float32BufferAttribute(offsets, 2));
  geometry.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 1));
  geometry.index = new THREE.Uint16BufferAttribute(indices, 1);
  return geometry;
}

function snowRatio(): number {
  return 1 - (1 - Math.max(getGame().weather.snow.value, 0)) ** 4;
}

export class RainLines {
  readonly #thickness = uniform(0.015);
  readonly #elevation = uniform(20);
  readonly #incline = uniform(0.2);
  readonly #size = uniform(0);
  readonly #center = uniform(vec2());
  readonly #length = uniform(2);
  readonly #localTime = uniform(0);
  readonly #visibleRatio = uniform(0);
  readonly #mesh: THREE.Mesh;
  #speed = 0.25;

  constructor() {
    const game = getGame();
    this.#size.value = game.view.optimalArea.radius * 2;
    this.#mesh = new THREE.Mesh(lineGeometry(), this.#material());
    this.#mesh.position.y = MESH_OFFSET_Y;
    this.#mesh.frustumCulled = false;
    this.#mesh.renderOrder = 1;
    game.scene.add(this.#mesh);

    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    game.viewport.events.on(
      'throttleChange',
      () => {
        this.#size.value = game.view.optimalArea.radius * 2;
      },
      THROTTLE_ORDER,
    );
  }

  #material(): MeshDefaultMaterial {
    const material = new MeshDefaultMaterial({
      normalNode: vec3(0, 1, 0),
      transparent: true,
      wireframe: false,
      hasCoreShadows: true,
      hasDropShadows: false,
      hasLightBounce: false,
      hasFog: false,
      hasWater: false,
    });
    material.positionNode = Fn(() => {
      const newPosition = attribute('position', 'vec3').toVar();
      const offset = attribute('offset', 'vec2');
      const random = attribute('random', 'float');
      const tangent = vec2(0.707, -0.707);

      newPosition.xz.mulAssign(this.#size);
      newPosition.xz.subAssign(this.#center);
      const halfSize = this.#size.mul(0.5);
      newPosition.x.assign(mod(newPosition.x.add(halfSize), this.#size).sub(halfSize));
      newPosition.z.assign(mod(newPosition.z.add(halfSize), this.#size).sub(halfSize));
      newPosition.xz.addAssign(this.#center);
      newPosition.xz.addAssign(tangent.mul(offset.x.mul(this.#thickness)));

      const progress = this.#localTime.add(random).mod(1);
      newPosition.y.assign(this.#elevation.add(this.#length));
      newPosition.y.subAssign(this.#length.mul(offset.y.oneMinus()));
      newPosition.y.subAssign(progress.mul(this.#elevation.add(this.#length)));
      newPosition.y.assign(newPosition.y.clamp(0, this.#elevation));

      const hidden = step(this.#visibleRatio, fract(random.mul(99)));
      newPosition.y.addAssign(hidden.mul(HIDDEN_LIFT));
      newPosition.xz.addAssign(tangent.mul(newPosition.y.mul(this.#incline).mul(-1)));
      return newPosition;
    })();
    return material;
  }

  update(): void {
    const { weather, view, ticker } = getGame();
    const rain = weather.rain.value;
    const snow = snowRatio();
    this.#visibleRatio.value = rain ** 2;
    this.#length.value = lerp(remapClamp(rain, [0, 1], [1, 3]), SNOW.length, snow);
    this.#speed = lerp(remapClamp(rain, [0, 1], [0.2, 0.4]), SNOW.speed, snow);
    this.#incline.value = remapClamp(weather.wind.value, [0, 1], [0.1, 0.4]);

    this.#mesh.visible = this.#visibleRatio.value > MIN_VISIBLE_RATIO;
    if (!this.#mesh.visible) return;
    this.#center.value.set(view.optimalArea.position.x, view.optimalArea.position.z);
    this.#localTime.value += ticker.deltaScaled * this.#speed;
  }
}
