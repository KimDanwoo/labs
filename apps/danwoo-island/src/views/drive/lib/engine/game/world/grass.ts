import {
  attribute,
  Fn,
  mix,
  mod,
  modelWorldMatrix,
  rotateUV,
  smoothstep,
  texture,
  uniform,
  varying,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { QUALITY } from '@views/drive/lib/engine/game/quality';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

import bladeProfile from '@views/drive/lib/engine/game/world/grassBladeShape.json';

const SUBDIVISIONS_BY_QUALITY = { [QUALITY.high]: 196, [QUALITY.low]: 140 } as const;
const SURFACE_IDEAL = 2000;
const BLADE = { width: 0.35, height: 0.29, heightRandomness: 0.55 } as const;
const SUNLIT_TIP = [1.12, 1.09, 0.93] as const;
const PATCH = { scale: 0.045, lush: [0.84, 0.98, 0.95], sunlit: [1.16, 1.1, 0.8] } as const;
const OVERFLOW_GROWTH = { initial: 0.5, resized: 0.4 } as const;
const HEIGHT_NOISE_SCALE = 0.0321;
const THROTTLE_ORDER = 2;

function surfaceOverflow(size: number): number {
  return Math.max(0, size * size - SURFACE_IDEAL) / SURFACE_IDEAL;
}

function bladeGeometry(size: number, fragmentSize: number, subdivisions: number): THREE.BufferGeometry {
  const count = subdivisions * subdivisions;
  const position = new Float32Array(count * 2);
  const heightRandomness = new Float32Array(count);
  const heading = new Float32Array(count);
  for (let x = 0; x < subdivisions; x += 1) {
    const fragmentX = (x / subdivisions - 0.5) * size + fragmentSize * 0.5;
    for (let z = 0; z < subdivisions; z += 1) {
      const fragmentZ = (z / subdivisions - 0.5) * size + fragmentSize * 0.5;
      const blade = x * subdivisions + z;
      const positionX = fragmentX + (Math.random() - 0.5) * fragmentSize;
      const positionZ = fragmentZ + (Math.random() - 0.5) * fragmentSize;
      position.set([positionX, positionZ], blade * 2);
      heightRandomness[blade] = Math.random();
      heading[blade] = Math.random() * 2 * Math.PI;
    }
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.instanceCount = count;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(bladeProfile.interior, 3));
  geometry.setAttribute('fringe', new THREE.Float32BufferAttribute(bladeProfile.fringe, 3));
  geometry.setAttribute('heading', new THREE.InstancedBufferAttribute(heading, 1));
  geometry.setAttribute('bladeRoot', new THREE.InstancedBufferAttribute(position, 2));
  geometry.setAttribute('heightRandomness', new THREE.InstancedBufferAttribute(heightRandomness, 1));
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
    const profile = attribute('position', 'vec3');
    const tipness = varying(profile.y);
    const wind = varying(vec2());
    const bladePosition = varying(vec2());
    const heightRandomness = uniform(BLADE.heightRandomness);

    const terrainData = game.terrain.terrainNode(bladePosition);
    const grassAmount = terrainData.g;

    const material = new MeshDefaultMaterial({
      side: THREE.DoubleSide,
      hasCoreShadows: false,
      colorNode: mix(
        game.terrain.colorNode(terrainData),
        game.terrain.grassColorUniform.rgb
          .mul(vec3(...SUNLIT_TIP))
          .mul(
            mix(
              vec3(...PATCH.lush),
              vec3(...PATCH.sunlit),
              texture(game.noises.perlin, bladePosition.mul(PATCH.scale)).r,
            ),
          ),
        tipness,
      ),
      normalNode: vec3(0, 1, 0),
      hasWater: false,
      hasLightBounce: false,
      shadowNode: tipness.oneMinus().mul(grassAmount).mul(0.36),
    });

    material.positionNode = Fn(() => {
      const loopPosition = attribute('bladeRoot', 'vec2').sub(this.#center);
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
      const interior = smoothstep(0.34, 0.78, grassAmount);
      const sprig = mix(attribute('fringe', 'vec3'), profile, interior);
      const heading = attribute('heading', 'float');
      const angle = mix(heading.sin().mul(0.48), heading, interior);
      const spread = rotateUV(sprig.xz, angle, vec2(0)).mul(this.#bladeWidth).mul(grassAmount);
      const vertexPosition = position3.add(vec3(spread.x, sprig.y.mul(height), spread.y));
      wind.assign(game.wind.offsetNode(worldPosition.xz).mul(tipness).mul(height).mul(2));
      vertexPosition.addAssign(vec3(wind.x, 0, wind.y));
      vertexPosition.y.addAssign(terrainData.b.mul(-1.5));
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
