import {
  color,
  cos,
  float,
  Fn,
  instancedArray,
  instanceIndex,
  min,
  mix,
  positionGeometry,
  sin,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { paintAchievementsBasin } from '@views/drive/lib/engine/game/world/islandReskins';
import { rebuildWaterfallCliff, replaceWithPillar } from '@views/drive/lib/engine/game/world/islandStructures';
import { rebuildVillageProps } from '@views/drive/lib/engine/game/world/islandVillage';

const PARTICLE_COUNT = 100;
const STILL_FOAM = 1.35;
const WATERFALL_MATERIAL = { hasLightBounce: false, hasWater: false, hasReveal: false, hasSeeThrough: true } as const;

type GeometryObject = THREE.Object3D & { geometry: THREE.BufferGeometry };

function hasGeometry(object: THREE.Object3D): object is GeometryObject {
  return 'geometry' in object && object.geometry instanceof THREE.BufferGeometry;
}

function particleEndpoints(reference: GeometryObject): { origin: THREE.Vector3; destination: THREE.Vector3 } {
  const positions = reference.geometry.attributes.position;
  if (!positions) throw new Error('Waterfall particle reference has no positions');
  const origin = new THREE.Vector3().fromBufferAttribute(positions, 0).applyMatrix4(reference.matrixWorld);
  const destination = new THREE.Vector3().fromBufferAttribute(positions, 1).applyMatrix4(reference.matrixWorld);
  return { origin, destination };
}

export class AchievementsArea extends Area {
  readonly #pillar: THREE.Object3D;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#pillar = this.requireReference('pillar');
    replaceWithPillar(this.#pillar);
    this.game.audio.register({
      path: 'sounds/magic/Mountain Audio - Small Chimes - Loop.mp3',
      autoplay: true,
      loop: true,
      volume: 0.15,
      positions: this.#pillar.position,
      distanceFade: 20,
    });
    this.#paintStillWater();
    this.#paintFallingWater();
    this.#createSplashes();
  }

  override setObjects(): void {
    rebuildWaterfallCliff(this.model);
    paintAchievementsBasin(this.model);
    rebuildVillageProps(this.model);
    super.setObjects();
  }

  #assignMaterial(name: string, material: THREE.Material): void {
    const mesh = this.requireReference(name);
    if (mesh instanceof THREE.Mesh) mesh.material = material;
  }

  #paintStillWater(): void {
    const { terrain, ticker, noises } = this.game;
    const waterColorA = uniform(color(terrain.colors[1].value));
    const waterColorB = uniform(color(terrain.colors[2].value));
    const colorNode = Fn(() => {
      const baseUv = uv().toVar();
      const baseColor = vec3().toVar();
      const xMix = baseUv.x.sub(0.5).mul(2).abs().pow3().max(0);
      baseColor.assign(mix(waterColorB, waterColorA, xMix));

      const foamUv = baseUv.toVar();
      foamUv.x.assign(foamUv.x.sub(0.5).abs().mul(2));
      const uv3 = foamUv.sub(vec2(ticker.elapsedScaledUniform.mul(0.05), 0)).mul(vec2(0.35, 0.96));
      const uv4 = foamUv.sub(vec2(ticker.elapsedScaledUniform.mul(0.041), 0)).mul(vec2(0.75, 1.28));
      const noise = min(texture(noises.voronoi, uv3).r, texture(noises.voronoi, uv4).r);
      const threshold = baseUv.x.sub(0.5).abs().mul(2).add(0.5).mul(0.5).oneMinus();
      baseColor.assign(mix(baseColor, color('#ffffff'), noise.step(threshold.mul(STILL_FOAM))));
      return vec3(baseColor);
    })();
    this.#assignMaterial('waterfallStill', new MeshDefaultMaterial({ colorNode, ...WATERFALL_MATERIAL }));
  }

  #paintFallingWater(): void {
    const { ticker, noises } = this.game;
    const colorNode = Fn(() => {
      const baseUv = uv().toVar();
      const uv3 = baseUv.sub(vec2(0, ticker.elapsedScaledUniform.mul(0.11))).mul(vec2(0.7, 0.6));
      const uv4 = baseUv.sub(vec2(0, ticker.elapsedScaledUniform.mul(0.085))).mul(vec2(1.5, 0.8));
      const noise = min(texture(noises.voronoi, uv3).r, texture(noises.voronoi, uv4).r);
      const threshold = baseUv.y.sub(0.5).abs().mul(2).add(0.5).mul(0.5);
      noise.lessThan(threshold).discard();
      return vec3(1);
    })();
    this.#assignMaterial('waterfallDrop', new MeshDefaultMaterial({ colorNode, ...WATERFALL_MATERIAL }));
  }

  #createSplashes(): void {
    const reference = this.requireReference('waterfallParticles');
    if (!hasGeometry(reference)) throw new Error('Waterfall particles reference has no geometry');
    reference.removeFromParent();
    const { origin, destination } = particleEndpoints(reference);
    const length = origin.distanceTo(destination);
    const delta = destination.clone().sub(origin);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const angles = new Float32Array(PARTICLE_COUNT);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions[index * 3 + 2] = length * Math.random();
      angles[index] = Math.PI - Math.PI * 0.5 * Math.random();
    }
    const positionAttribute = instancedArray(positions, 'vec3').toAttribute();
    const angleAttribute = instancedArray(angles, 'float').toAttribute();

    const material = new MeshDefaultMaterial({
      ...WATERFALL_MATERIAL,
      alphaTest: 0.1,
      alphaNode: uv().sub(0.5).length().oneMinus().sub(0.5),
    });
    const { ticker } = this.game;
    material.positionNode = Fn(() => {
      const progress = ticker.elapsedScaledUniform.mul(0.2).add(float(instanceIndex).div(PARTICLE_COUNT)).fract();
      const scaled = positionGeometry.toVar().mul(progress.oneMinus().mul(0.4));
      const finalPosition = scaled.add(positionAttribute).toVar();
      const distance = progress.oneMinus().pow2().oneMinus();
      finalPosition.y.addAssign(sin(angleAttribute).mul(distance).mul(2));
      finalPosition.x.addAssign(cos(angleAttribute).mul(distance).mul(1.5));
      return finalPosition;
    })();

    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.rotateY(-Math.PI * 0.5);
    geometry.rotateZ(-Math.PI * 0.25);
    const mesh = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.lookAt(delta.multiplyScalar(-1));
    mesh.position.copy(destination);
    mesh.count = PARTICLE_COUNT;
    this.game.scene.add(mesh);
    this.objects.hideable.push(mesh);
  }
}
