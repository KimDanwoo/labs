import { alea } from 'seedrandom';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Fn, mix, normalWorld, positionLocal, rotateUV, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { applyInstanceMatrix } from '@views/drive/lib/engine/game/utilities/instanceMatrix';
import { distanceToVehicleOnScreen, isInFrontOfVehicle } from '@views/drive/lib/engine/game/world/vehicleSeeThrough';

type ColorUniform = THREE.UniformNode<'color', THREE.Color>;

interface FoliageOptions {
  references: readonly THREE.Object3D[];
  colorA: ColorUniform;
  colorB: ColorUniform;
}

const rng = alea('foliage');
const PLANE_COUNT = 40;
const PLANE_SIZE = 1.2;
const LEAF_CLUSTER = { seed: 'leafCluster', size: 128, count: 8, length: 0.2, width: 0.12, margin: 0.24 } as const;
const NORMAL_BLEND = 0.85;
const WIND_ROTATION = 2.2;
const SEE_THROUGH_EDGE = { min: 5, max: 15 } as const;
const SEE_THROUGH_DEPTH_MARGIN = 1;

function leafClusterTexture(): THREE.CanvasTexture {
  const { size, count, length, width, margin } = LEAF_CLUSTER;
  const random = alea(LEAF_CLUSTER.seed);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.fillStyle = '#000';
  context.fillRect(0, 0, size, size);
  context.globalCompositeOperation = 'lighten';
  const radius = length * size;
  for (let leaf = 0; leaf < count; leaf += 1) {
    const spread = 1 - margin * 2;
    context.save();
    context.translate((margin + random() * spread) * size, (margin + random() * spread) * size);
    context.rotate(random() * Math.PI);
    context.scale(1, width / length);
    const falloff = context.createRadialGradient(0, 0, 0, 0, 0, radius);
    falloff.addColorStop(0, '#fff');
    falloff.addColorStop(1, '#000');
    context.fillStyle = falloff;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  return new THREE.CanvasTexture(canvas);
}

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
  readonly #threshold = uniform(0.3);
  readonly #seeThroughEdgeMin = uniform(0.11);
  readonly #seeThroughEdgeMax = uniform(0.57);
  readonly #shadowOffset = uniform(1);
  readonly #instanceMatrix: THREE.InstancedBufferAttribute;

  constructor({ references, colorA, colorB }: FoliageOptions) {
    const game = getGame();
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

    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.foliage);
  }

  #material(colorA: ColorUniform, colorB: ColorUniform): MeshDefaultMaterial {
    const game = getGame();
    const foliageTexture = leafClusterTexture();
    const foliageAlpha = Fn(() => {
      const rotatedUv = rotateUV(uv(), game.wind.offsetNode(positionLocal.xz).length().mul(WIND_ROTATION), vec2(0.5));
      return texture(foliageTexture, rotatedUv).r;
    });
    const alphaNode = Fn(() => {
      const isInFront = isInFrontOfVehicle(SEE_THROUGH_DEPTH_MARGIN);
      const edgeFade = smoothstep(this.#seeThroughEdgeMin, this.#seeThroughEdgeMax, distanceToVehicleOnScreen());
      const distanceFade = mix(1, edgeFade, isInFront);
      const alpha = foliageAlpha().mul(distanceFade.mul(this.#threshold.oneMinus()).add(this.#threshold)).toVar();
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
    const { view } = getGame();
    const radius = view.spherical.radius.current;
    this.#seeThroughEdgeMin.value = (SEE_THROUGH_EDGE.min / radius) * this.seeThroughMultiplier;
    this.#seeThroughEdgeMax.value = (SEE_THROUGH_EDGE.max / radius) * this.seeThroughMultiplier;
  }
}
