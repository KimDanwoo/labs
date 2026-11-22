import {
  atan,
  attribute,
  cameraPosition,
  Fn,
  mix,
  mod,
  modelWorldMatrix,
  rotateUV,
  step,
  texture,
  uniform,
  uniformArray,
  varying,
  vec2,
  vec3,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { QUALITY } from '@views/drive/lib/engine/game/quality';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

const SUBDIVISIONS_BY_QUALITY = { [QUALITY.high]: 200, [QUALITY.low]: 140 } as const;
const SURFACE_IDEAL = 2000;
const BLADE = { width: 0.22, height: 0.48, heightRandomness: 0.55, lean: 0.9 } as const;
const SHADE = { base: [0.56, 0.72, 0.7], tip: [1.32, 1.26, 0.9] } as const;
const PATCH = { scale: 0.045, lush: [0.84, 0.98, 0.95], sunlit: [1.16, 1.1, 0.8] } as const;
const SPRIG = { root: 0.35, overlap: 0.05, shortTip: 0.7 } as const;
const LEAF_SHAPE = [-SPRIG.root, 0, -1, 1, SPRIG.overlap, 0, -SPRIG.overlap, 0, 1, SPRIG.shortTip, SPRIG.root, 0];
const LEAF_VERTICES = LEAF_SHAPE.length / 2;
const OVERFLOW_GROWTH = { initial: 0.5, resized: 0.4 } as const;
const HIDDEN_THRESHOLD = 0.1;
const HIDDEN_LIFT = 100;
const HEIGHT_NOISE_SCALE = 0.0321;
const THROTTLE_ORDER = 2;

function surfaceOverflow(size: number): number {
  return Math.max(0, size * size - SURFACE_IDEAL) / SURFACE_IDEAL;
}

function bladeGeometry(size: number, fragmentSize: number, subdivisions: number): THREE.BufferGeometry {
  const count = subdivisions * subdivisions;
  const position = new Float32Array(count * LEAF_VERTICES * 2);
  const heightRandomness = new Float32Array(count * LEAF_VERTICES);
  for (let x = 0; x < subdivisions; x += 1) {
    const fragmentX = (x / subdivisions - 0.5) * size + fragmentSize * 0.5;
    for (let z = 0; z < subdivisions; z += 1) {
      const fragmentZ = (z / subdivisions - 0.5) * size + fragmentSize * 0.5;
      const blade = x * subdivisions + z;
      const positionX = fragmentX + (Math.random() - 0.5) * fragmentSize;
      const positionZ = fragmentZ + (Math.random() - 0.5) * fragmentSize;
      const randomness = Math.random();
      for (let vertex = 0; vertex < LEAF_VERTICES; vertex += 1) {
        position.set([positionX, positionZ], (blade * LEAF_VERTICES + vertex) * 2);
        heightRandomness[blade * LEAF_VERTICES + vertex] = randomness;
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 2));
  geometry.setAttribute('heightRandomness', new THREE.Float32BufferAttribute(heightRandomness, 1));
  return geometry;
}

export class Grass {
  readonly #center = uniform(new THREE.Vector2());
  readonly #size: THREE.UniformNode<'float', number>;
  readonly #bladeWidth: THREE.UniformNode<'float', number>;
  readonly #bladeHeight: THREE.UniformNode<'float', number>;
  #subdivisions: number;
  #fragmentSize: number;
  readonly #mesh: THREE.Mesh;

  constructor() {
    const game = getGame();
    const size = game.view.optimalArea.radius * 2;
    const overflow = surfaceOverflow(size);
    this.#subdivisions = SUBDIVISIONS_BY_QUALITY[game.quality.level];
    this.#fragmentSize = size / this.#subdivisions;
    this.#size = uniform(size);
    this.#bladeWidth = uniform(this.#widthScale() * BLADE.width * (1 + overflow * OVERFLOW_GROWTH.initial));
    this.#bladeHeight = uniform(BLADE.height * (1 + overflow * OVERFLOW_GROWTH.initial));

    this.#mesh = new THREE.Mesh(bladeGeometry(size, this.#fragmentSize, this.#subdivisions), this.#material());
    this.#mesh.frustumCulled = false;
    this.#mesh.receiveShadow = true;
    game.scene.add(this.#mesh);

    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.grass);
    game.viewport.events.on('throttleChange', () => this.#resize(), THROTTLE_ORDER);
    game.quality.events.on('change', (level) => {
      this.#subdivisions = SUBDIVISIONS_BY_QUALITY[level];
      this.#resize();
    });
  }

  #widthScale(): number {
    return SUBDIVISIONS_BY_QUALITY[QUALITY.high] / this.#subdivisions;
  }

  #resize(): void {
    const size = getGame().view.optimalArea.radius * 2;
    const overflow = surfaceOverflow(size);
    this.#size.value = size;
    this.#fragmentSize = size / this.#subdivisions;
    this.#bladeWidth.value = this.#widthScale() * BLADE.width * (1 + overflow * OVERFLOW_GROWTH.resized);
    this.#bladeHeight.value = BLADE.height * (1 + overflow * OVERFLOW_GROWTH.resized);
    this.#mesh.geometry.dispose();
    this.#mesh.geometry = bladeGeometry(size, this.#fragmentSize, this.#subdivisions);
  }

  #material(): MeshDefaultMaterial {
    const game = getGame();
    const leafShape = uniformArray<'float'>(LEAF_SHAPE, 'float');
    const shapeIndex = vertexIndex.toFloat().mod(LEAF_VERTICES).mul(2);
    const tipness = varying(leafShape.element(shapeIndex.add(1)));
    const wind = varying(vec2());
    const bladePosition = varying(vec2());
    const heightRandomness = uniform(BLADE.heightRandomness);

    const terrainData = game.terrain.terrainNode(bladePosition);
    const grassAmount = terrainData.g;
    const hidden = step(terrainData.g.sub(0.4), HIDDEN_THRESHOLD);

    const material = new MeshDefaultMaterial({
      colorNode: game.terrain
        .colorNode(terrainData)
        .mul(mix(vec3(...SHADE.base), vec3(...SHADE.tip), tipness))
        .mul(
          mix(
            vec3(...PATCH.lush),
            vec3(...PATCH.sunlit),
            texture(game.noises.perlin, bladePosition.mul(PATCH.scale)).r,
          ),
        ),
      normalNode: vec3(0, 1, 0),
      hasWater: false,
      hasLightBounce: false,
      shadowNode: tipness.oneMinus().mul(grassAmount),
    });

    material.positionNode = Fn(() => {
      const loopPosition = attribute('position', 'vec2').sub(this.#center);
      const halfSize = this.#size.mul(0.5);
      loopPosition.x.assign(mod(loopPosition.x.add(halfSize), this.#size).sub(halfSize));
      loopPosition.y.assign(mod(loopPosition.y.add(halfSize), this.#size).sub(halfSize));

      const position3 = vec3(loopPosition.x, 0, loopPosition.y).add(vec3(this.#center.x, 0, this.#center.y));
      const worldPosition = modelWorldMatrix.mul(position3);
      bladePosition.assign(worldPosition.xz);

      const heightVariation = texture(game.noises.perlin, bladePosition.mul(HEIGHT_NOISE_SCALE)).r.add(0.5);
      const height = this.#bladeHeight
        .mul(heightRandomness.mul(attribute('heightRandomness', 'float')).add(heightRandomness.oneMinus()))
        .mul(heightVariation)
        .mul(grassAmount);
      const lean = attribute('heightRandomness', 'float').sub(0.5).mul(BLADE.lean).mul(tipness);
      const shape = vec3(
        leafShape.element(shapeIndex).add(lean).mul(this.#bladeWidth).mul(grassAmount),
        tipness.mul(height),
        0,
      );
      const vertexPosition = position3.add(shape);

      const angleToCamera = atan(worldPosition.z.sub(cameraPosition.z), worldPosition.x.sub(cameraPosition.x)).add(
        -Math.PI * 0.5,
      );
      vertexPosition.xz.assign(rotateUV(vertexPosition.xz, angleToCamera, worldPosition.xz));
      wind.assign(game.wind.offsetNode(worldPosition.xz).mul(tipness).mul(height).mul(2));
      vertexPosition.addAssign(vec3(wind.x, 0, wind.y));
      vertexPosition.y.addAssign(hidden.mul(HIDDEN_LIFT));
      return vertexPosition;
    })();
    return material;
  }

  setVisible(isVisible: boolean): void {
    this.#mesh.visible = isVisible;
  }

  update(): void {
    const { position } = getGame().view.optimalArea;
    this.#center.value.set(position.x, position.z);
  }
}
