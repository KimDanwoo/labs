import { alea } from 'seedrandom';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Fn,
  float,
  mix,
  normalWorld,
  positionLocal,
  rotateUV,
  screenSize,
  screenUV,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { applyInstanceMatrix } from '../utilities/instanceMatrix';

type ColorUniform = THREE.UniformNode<'color', THREE.Color>;

export interface FoliageOptions {
  references: readonly THREE.Object3D[];
  colorA: ColorUniform;
  colorB: ColorUniform;
  isSeeThrough?: boolean;
}

const rng = alea('foliage');
const PLANE_COUNT = 56;
const PLANE_SIZE = 1.0;
const NORMAL_BLEND = 0.85;
const WIND_ROTATION = 2.2;
const SEE_THROUGH_EDGE = { min: 3, max: 15 } as const;
const TICK_ORDER = 10;

function leafPlane(): THREE.PlaneGeometry {
  const plane = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
  const spherical = new THREE.Spherical(1 - rng() ** 3, Math.PI * 2 * rng(), Math.PI * rng());
  const center = new THREE.Vector3().setFromSpherical(spherical);
  plane.rotateZ(rng() * 9999);
  plane.rotateY(0);
  plane.translate(center.x, center.y, center.z);

  const normal = center.clone().normalize();
  const normals = new Float32Array(12);
  const positions = plane.attributes.position;
  if (!positions) return plane;
  for (let vertex = 0; vertex < 4; vertex += 1) {
    const blended = new THREE.Vector3().fromBufferAttribute(positions, vertex).lerp(normal, NORMAL_BLEND);
    normals.set([blended.x, blended.y, blended.z], vertex * 3);
  }
  plane.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return plane;
}

function facingMatrices(references: readonly THREE.Object3D[]): THREE.Matrix4[] {
  const towardCamera = getGame().view.spherical.offset.clone().normalize();
  return references.map((reference) => {
    const object = new THREE.Object3D();
    const angle = Math.PI * 2 * rng();
    object.up.set(Math.sin(angle), Math.cos(angle), 0);
    object.lookAt(towardCamera);
    object.position.copy(reference.position);
    object.scale.setScalar(reference.scale.x);
    object.updateMatrix();
    return object.matrix;
  });
}

export class Foliage {
  seeThroughMultiplier = 1;
  readonly #isSeeThrough: boolean;
  readonly #threshold = uniform(0.3);
  readonly #seeThroughPosition = uniform(vec2());
  readonly #seeThroughEdgeMin = uniform(0.11);
  readonly #seeThroughEdgeMax = uniform(0.57);
  readonly #shadowOffset = uniform(1);
  readonly #instanceMatrix: THREE.InstancedBufferAttribute;

  constructor({ references, colorA, colorB, isSeeThrough = false }: FoliageOptions) {
    const game = getGame();
    this.#isSeeThrough = isSeeThrough;
    const geometry = mergeGeometries(Array.from({ length: PLANE_COUNT }, leafPlane));
    const material = this.#material(colorA, colorB);
    const matrices = facingMatrices(references);

    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.count = matrices.length;
    mesh.frustumCulled = false;
    game.scene.add(mesh);

    this.#instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count * 16), 16);
    this.#instanceMatrix.setUsage(THREE.StaticDrawUsage);
    for (const [index, matrix] of matrices.entries()) matrix.toArray(this.#instanceMatrix.array, index * 16);

    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #material(colorA: ColorUniform, colorB: ColorUniform): MeshDefaultMaterial {
    const game = getGame();
    const foliageTexture = game.texture('foliageTexture');
    const foliageAlpha = Fn(() => {
      const rotatedUv = rotateUV(uv(), game.wind.offsetNode(positionLocal.xz).length().mul(WIND_ROTATION), vec2(0.5));
      return texture(foliageTexture, rotatedUv).r;
    });
    const alphaNode = Fn(() => {
      const alpha = float(1);
      if (this.#isSeeThrough) {
        const toVehicle = screenUV.sub(this.#seeThroughPosition);
        toVehicle.mulAssign(vec2(screenSize.x.div(screenSize.y), 1));
        const distanceFade = smoothstep(this.#seeThroughEdgeMin, this.#seeThroughEdgeMax, toVehicle.length());
        alpha.assign(foliageAlpha().mul(distanceFade.mul(this.#threshold.oneMinus()).add(this.#threshold)));
      } else {
        alpha.assign(foliageAlpha());
      }
      alpha.subAssign(this.#threshold);
      return alpha;
    })();
    const colorNode = Fn(() => {
      const mixStrength = normalWorld.dot(game.lighting.directionUniform).smoothstep(0, 1);
      return mix(colorA, colorB, mixStrength).rgb;
    })();

    const material = new MeshDefaultMaterial({ colorNode, alphaNode, hasWater: false });
    material.positionNode = Fn(() => {
      applyInstanceMatrix(this.#instanceMatrix);
      return positionLocal;
    })();
    material.receivedShadowPositionNode = positionLocal.add(game.lighting.directionUniform.mul(this.#shadowOffset));
    material.maskShadowNode = texture(foliageTexture).r.greaterThan(0.5);
    return material;
  }

  update(): void {
    const { world, view } = getGame();
    const screenPosition = world.visualVehicle?.screenPosition;
    if (screenPosition) this.#seeThroughPosition.value.copy(screenPosition);
    const radius = view.spherical.radius.current;
    this.#seeThroughEdgeMin.value = (SEE_THROUGH_EDGE.min / radius) * this.seeThroughMultiplier;
    this.#seeThroughEdgeMax.value = (SEE_THROUGH_EDGE.max / radius) * this.seeThroughMultiplier;
  }
}
