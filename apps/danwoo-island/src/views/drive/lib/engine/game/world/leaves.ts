import {
  color,
  float,
  Fn,
  hash,
  instancedArray,
  instanceIndex,
  materialNormal,
  max,
  mix,
  mod,
  modelViewMatrix,
  normalWorld,
  positionGeometry,
  rotateUV,
  sin,
  step,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { remap } from '../utilities/maths';

const COUNT_POWER_RANGE: [number, number] = [7, 11];
const LEAVES_RANGE: [number, number] = [0.25, 1];
const EXPLOSION_STRENGTH = 20;
const RENDER_ORDER = 2;
const TICK_ORDER = 10;

function randomArray(count: number, sample: () => number): Float32Array {
  return Float32Array.from({ length: count }, sample);
}

function randomNormals(count: number): Float32Array {
  const normals = new Float32Array(count * 3);
  const axisX = new THREE.Vector3(1, 0, 0);
  const axisZ = new THREE.Vector3(0, 0, 1);
  for (let index = 0; index < count; index += 1) {
    const normal = new THREE.Vector3(0, 1, 0);
    normal.applyAxisAngle(axisX, (Math.random() - 0.5) * 2);
    normal.applyAxisAngle(axisZ, (Math.random() - 0.5) * 2);
    normal.toArray(normals, index * 3);
  }
  return normals;
}

function petalGeometry(): THREE.ShapeGeometry {
  const petal = new THREE.Shape();
  petal.moveTo(0, -0.5);
  petal.quadraticCurveTo(0.5, -0.2, 0.32, 0.4);
  petal.lineTo(0.1, 0.5);
  petal.lineTo(0, 0.36);
  petal.lineTo(-0.1, 0.5);
  petal.lineTo(-0.32, 0.4);
  petal.quadraticCurveTo(-0.5, -0.2, 0, -0.5);
  const geometry = new THREE.ShapeGeometry(petal, 3);
  geometry.rotateX(-Math.PI * 0.5);
  return geometry;
}

export class Leaves {
  readonly #count: number;
  readonly #focusPoint = uniform(vec2());
  readonly #vehicleVelocity = uniform(vec3());
  readonly #vehiclePosition = uniform(vec3());
  readonly #scale = uniform(0.25);
  readonly #rotationFrequency = uniform(3);
  readonly #rotationElevationMultiplier = uniform(1);
  readonly #pushSidewaysMultiplier = uniform(20);
  readonly #pushMultiplier = uniform(100);
  readonly #windFrequency = uniform(0.005);
  readonly #windMultiplier = uniform(0.5);
  readonly #upwardMultiplier = uniform(1);
  readonly #defaultDamping = uniform(1.5);
  readonly #waterDamping = uniform(0.75);
  readonly #gravity = uniform(9.807);
  readonly #explosion = uniform(vec4(0));
  readonly #positionBuffer: THREE.StorageBufferNode<'vec3'>;
  readonly #velocityBuffer: THREE.StorageBufferNode<'vec3'>;
  readonly #weightBuffer: THREE.StorageBufferNode<'float'>;
  readonly #updateCompute: THREE.ComputeNode;

  constructor() {
    const game = getGame();
    const power = Math.round(remap(game.yearCycles.numberOf('leaves'), LEAVES_RANGE, COUNT_POWER_RANGE));
    this.#count = 2 ** power;
    this.#positionBuffer = instancedArray(this.#count, 'vec3');
    this.#velocityBuffer = instancedArray(this.#count, 'vec3');

    const rotations = randomArray(this.#count, () => Math.random() * Math.PI * 2);
    const scales = randomArray(this.#count, () => Math.random() * 0.5 + 0.5);
    this.#weightBuffer = instancedArray(
      randomArray(this.#count, () => Math.random() * 0.1 + 0.1),
      'float',
    );
    const normals = randomNormals(this.#count);

    const geometry = petalGeometry();
    const material = this.#material(rotations, scales, normals);
    const size = float(game.view.optimalArea.radius * 2);
    void game.rendering.renderer.computeAsync(this.#initNode(size).compute(this.#count));
    this.#updateCompute = this.#updateNode(size).compute(this.#count);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.count = this.#count;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = RENDER_ORDER;
    game.scene.add(mesh);

    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #material(rotations: Float32Array, scales: Float32Array, normalArray: Float32Array): MeshDefaultMaterial {
    const baseRotation = instancedArray(rotations, 'float').toAttribute();
    const scale = instancedArray(scales, 'float').toAttribute();

    const colorA = uniform(color(0xe17f9c));
    const colorB = uniform(color(0xffd3de));
    const colorNode = Fn(() => vec3(mix(colorA, colorB, hash(instanceIndex.add(99)))))();
    const normals = instancedArray(normalArray, 'vec3').toAttribute();

    const material = new MeshDefaultMaterial({
      side: THREE.DoubleSide,
      colorNode,
      normalNode: normalWorld,
      hasWater: false,
      transparent: true,
    });
    material.positionNode = Fn(() => {
      materialNormal.assign(modelViewMatrix.mul(vec4(normals, 0)));
      const leafPosition = this.#positionBuffer.toAttribute();
      const newPosition = positionGeometry.mul(scale).mul(this.#scale);
      const rotationMultiplier = max(leafPosition.y.mul(this.#rotationElevationMultiplier), 0);
      const rotationZ = sin(leafPosition.x.mul(this.#rotationFrequency)).mul(rotationMultiplier);
      const rotationX = sin(leafPosition.z.mul(this.#rotationFrequency)).mul(rotationMultiplier);
      newPosition.xy.assign(rotateUV(newPosition.xy, rotationZ, vec2(0)));
      newPosition.yz.assign(rotateUV(newPosition.yz, rotationX, vec2(0)));
      newPosition.xz.assign(rotateUV(newPosition.xz, baseRotation, vec2(0)));
      return newPosition.add(leafPosition);
    })();
    return material;
  }

  #initNode(size: THREE.Node<'float'>): THREE.Node {
    const { noises } = getGame();
    return Fn(() => {
      const position = this.#positionBuffer.element(instanceIndex);
      position.assign(vec3(hash(instanceIndex).sub(0.5).mul(size), 0, hash(instanceIndex.add(1)).sub(0.5).mul(size)));
      const noise = texture(noises.perlin, position.xz.mul(0.02)).r;
      position.x.addAssign(noise.mul(15));
    })();
  }

  #updateNode(size: THREE.Node<'float'>): THREE.Node {
    const { terrain, wind, noises, ticker, water } = getGame();
    const weightBuffer = this.#weightBuffer;
    return Fn(() => {
      const position = this.#positionBuffer.element(instanceIndex);
      const velocity = this.#velocityBuffer.element(instanceIndex);
      const weight = weightBuffer.element(instanceIndex);
      const terrainData = terrain.terrainNode(position.xz);

      const vehicleDelta = position.sub(this.#vehiclePosition);
      const pushSideways = vec3(vehicleDelta.x, 0, vehicleDelta.z).normalize().mul(this.#pushSidewaysMultiplier);
      const pushVelocity = vec3(this.#vehicleVelocity.x, 0, this.#vehicleVelocity.z).mul(this.#pushMultiplier);
      const vehicleMultiplier = vehicleDelta.length().remapClamp(0.5, 2, 1, 0);
      const speedMultiplier = this.#vehicleVelocity.length();
      velocity.addAssign(pushVelocity.add(pushSideways).mul(speedMultiplier).mul(vehicleMultiplier));

      const noiseUv = position.xz.mul(this.#windFrequency).add(wind.direction.mul(wind.localTime)).xy;
      const noise = texture(noises.perlin, noiseUv).r;
      const windStrength = wind.strength.sub(noise).mul(weight).mul(this.#windMultiplier).max(0);
      velocity.x.addAssign(wind.direction.x.mul(windStrength));
      velocity.z.addAssign(wind.direction.y.mul(windStrength));

      const explosionDelta = position.xz.sub(this.#explosion.xy);
      const explosionMultiplier = explosionDelta
        .length()
        .remapClamp(this.#explosion.z.mul(0.5), this.#explosion.z.mul(1), 0.2, 0);
      const explosionPush = vec2(explosionDelta.x, explosionDelta.y).mul(explosionMultiplier).mul(this.#explosion.a);
      velocity.addAssign(vec3(explosionPush.x, 0, explosionPush.y));

      const upwardDim = position.y.remapClamp(0, 6, 1, 0);
      velocity.y.assign(velocity.xz.length().min(2).mul(this.#upwardMultiplier).mul(upwardDim));

      const groundDamping = terrainData.b.remapClamp(0.4, 0, this.#waterDamping, this.#defaultDamping);
      const inTheAirDamping = step(0.05, position.y).mul(this.#defaultDamping);
      const damping = max(groundDamping, inTheAirDamping).mul(ticker.deltaScaledUniform);
      velocity.mulAssign(float(1).sub(damping));
      velocity.y.assign(velocity.y.sub(this.#gravity.mul(weight)));
      position.addAssign(velocity.mul(ticker.deltaScaledUniform));

      const floorY = terrainData.b.remapClamp(0.02, 0.13, 0, water.surfaceElevationUniform).add(0.02);
      position.y.assign(max(position.y, floorY));

      const halfSize = size.mul(0.5);
      position.x.assign(
        mod(position.x.add(halfSize).sub(this.#focusPoint.x), size).sub(halfSize).add(this.#focusPoint.x),
      );
      position.z.assign(
        mod(position.z.add(halfSize).sub(this.#focusPoint.y), size).sub(halfSize).add(this.#focusPoint.y),
      );
    })();
  }

  explode(coordinates: THREE.Vector3, radius: number): void {
    this.#explosion.value.set(coordinates.x, coordinates.z, radius, EXPLOSION_STRENGTH);
  }

  update(): void {
    const { view, physicalVehicle, rendering } = getGame();
    this.#focusPoint.value.set(view.optimalArea.position.x, view.optimalArea.position.z);
    this.#vehicleVelocity.value.copy(physicalVehicle.velocity);
    this.#vehiclePosition.value.copy(physicalVehicle.position);
    void rendering.renderer.computeAsync(this.#updateCompute);
    this.#explosion.value.w = 0;
  }
}
