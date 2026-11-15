import gsap from 'gsap';
import {
  cos,
  Fn,
  instancedArray,
  instanceIndex,
  positionLocal,
  remapClamp,
  sin,
  uniform,
  uniformArray,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { applyInstanceMatrix } from '../utilities/instanceMatrix';

const POOL_SIZE = 4;
const PIECES = 500;
const PIECE_SIZE = { width: 0.1, height: 0.2 } as const;
const COLORS = ['#ffbde7', '#eeff95', '#84ffb5'] as const;
const DURATION = 5;
const ELEVATION = 3;
const DEFAULTS = { radius: 4, elevation: 6 } as const;

function randomArray(sample: () => number): Float32Array {
  return Float32Array.from({ length: PIECES }, sample);
}

function randomOrientations(): THREE.InstancedBufferAttribute {
  const matrices = new THREE.InstancedBufferAttribute(new Float32Array(PIECES * 16), 16);
  matrices.setUsage(THREE.StaticDrawUsage);
  const origin = new THREE.Vector3();
  const unitScale = new THREE.Vector3(1, 1, 1);
  for (let index = 0; index < PIECES; index += 1) {
    new THREE.Matrix4().compose(origin, new THREE.Quaternion().random(), unitScale).toArray(matrices.array, index * 16);
  }
  return matrices;
}

class ConfettiBurst {
  isAvailable = true;
  readonly #mesh: THREE.InstancedMesh;
  readonly #progress = uniform(0);
  readonly #amplitude = uniform(0.7);
  readonly #radius = uniform(2);
  readonly #elevation = uniform(6);

  constructor(geometry: THREE.PlaneGeometry, colors: THREE.UniformArrayNode<'color'>) {
    const randomProgress = randomArray(() => Math.random());
    const angles = randomArray(() => Math.random() * Math.PI * 2);
    const progressBuffer = instancedArray(randomProgress, 'float').toAttribute();
    const angleBuffer = instancedArray(angles, 'float').toAttribute();

    const material = new MeshDefaultMaterial({
      colorNode: Fn(() => colors.element(instanceIndex.mod(3)).rgb)(),
      hasCoreShadows: true,
      hasDropShadows: false,
      hasLightBounce: false,
      hasFog: true,
      hasWater: false,
    });
    const rest = this.#amplitude.oneMinus();
    const orientations = randomOrientations();
    material.positionNode = Fn(() => {
      applyInstanceMatrix(orientations);
      const basePosition = positionLocal;
      const progressStart = rest.mul(progressBuffer);
      const progressEnd = progressStart.add(this.#amplitude);
      const progress = remapClamp(this.#progress, progressStart, progressEnd, 0, 1).toVar();
      progress.assign(progress.oneMinus().pow(3).oneMinus());
      basePosition.mulAssign(progress.sub(0.5).mul(2).abs().oneMinus().mul(20).min(1));

      const strength = progressBuffer.mul(99).fract();
      const x = sin(angleBuffer).mul(progress).mul(strength).mul(this.#radius);
      const z = cos(angleBuffer).mul(progress).mul(strength).mul(this.#radius);
      const y = progress.mul(2).oneMinus().pow(2).oneMinus().mul(strength).mul(this.#elevation);
      return vec3(basePosition.x.add(x), basePosition.y.add(y), basePosition.z.add(z));
    })();

    this.#mesh = new THREE.InstancedMesh(geometry, material, PIECES);
    this.#mesh.visible = false;
    this.#mesh.castShadow = true;
    this.#mesh.position.y = ELEVATION;
    getGame().scene.add(this.#mesh);
  }

  pop(position: THREE.Vector3, radius: number, elevation: number): void {
    this.isAvailable = false;
    this.#mesh.visible = true;
    this.#mesh.position.copy(position);
    this.#radius.value = radius;
    this.#elevation.value = elevation;
    gsap.fromTo(
      this.#progress,
      { value: 0 },
      {
        value: 1,
        duration: DURATION,
        onComplete: () => {
          this.isAvailable = true;
          this.#mesh.visible = false;
        },
      },
    );
  }
}

export class Confetti {
  readonly #pool: ConfettiBurst[];

  constructor() {
    const geometry = new THREE.PlaneGeometry(PIECE_SIZE.width, PIECE_SIZE.height);
    const colors = uniformArray<'color'>(
      COLORS.map((value) => new THREE.Color(value)),
      'color',
    );
    this.#pool = Array.from({ length: POOL_SIZE }, () => new ConfettiBurst(geometry, colors));
  }

  pop(position: THREE.Vector3, radius: number = DEFAULTS.radius, elevation: number = DEFAULTS.elevation): void {
    this.#pool.find(({ isAvailable }) => isAvailable)?.pop(position, radius, elevation);
  }
}
