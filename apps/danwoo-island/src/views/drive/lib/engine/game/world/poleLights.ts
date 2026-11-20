import gsap from 'gsap';
import { hash, instancedArray, instanceIndex, sin, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { InstancedGroup, type InstanceReference } from '@views/drive/lib/engine/game/instancedGroup';
import { createLampPost } from '@views/drive/lib/engine/game/world/islandProps';

const TRAILING_NUMBER = /[0-9]+$/i;
const FIREFLIES_PER_LIGHT = 5;
const FIREFLY_SIZE = 0.015;
const FIREFLY_SEGMENTS = 8;
const FADE_DURATION = 5;
const POLE_HALF_SIZE: [number, number, number] = [0.2, 1.7, 0.2];

function fireflyPositions(references: readonly InstanceReference[]): Float32Array {
  const positions = new Float32Array(references.length * FIREFLIES_PER_LIGHT * 3);
  let index = 0;
  for (const { position } of references) {
    for (let firefly = 0; firefly < FIREFLIES_PER_LIGHT; firefly += 1) {
      const angle = Math.random() * Math.PI * 2;
      positions.set([position.x + Math.cos(angle), position.y + 1, position.z + Math.sin(angle)], index * 3);
      index += 1;
    }
  }
  return positions;
}

export class PoleLights {
  readonly instancedGroup: InstancedGroup;
  readonly #references: InstanceReference[];
  readonly #glass: THREE.InstancedMesh;
  readonly #firefliesScale = uniform(0);

  constructor() {
    const game = getGame();
    const [base, references] = InstancedGroup.getBaseAndReferencesFromInstances(
      game.model('poleLightsModel').scene.children,
    );
    this.#references = references;
    for (const child of base.children) {
      child.name = child.name.replace(TRAILING_NUMBER, '');
      child.castShadow = true;
      child.receiveShadow = true;
    }
    game.materials.updateObject(base);

    this.instancedGroup = new InstancedGroup(references, createLampPost(), { isAutoUpdated: false });
    const glass = this.instancedGroup.meshes.find(({ instance }) => instance.name === 'glass')?.instance;
    if (!glass) throw new Error('Pole light glass is missing');
    this.#glass = glass;

    this.#addColliders();
    this.#addFireflies();
    game.dayCycles.events.on('night', (isNight) => this.#setLit(isNight));
    this.#setLit(game.dayCycles.isInInterval('night'));
  }

  #addColliders(): void {
    const game = getGame();
    for (const reference of this.#references) {
      game.objects.add(null, {
        type: 'fixed',
        position: reference.position,
        rotation: reference.quaternion,
        colliders: [{ shape: 'cuboid', parameters: POLE_HALF_SIZE, category: 'object' }],
        onCollision: (force, position) => game.audio.groups.get('hitDefault')?.playRandomNext(force, position),
      });
    }
  }

  #addFireflies(): void {
    const game = getGame();
    const positions = fireflyPositions(this.#references);
    const material = new THREE.SpriteNodeMaterial();
    material.outputNode = game.materials.emissiveOutput('emissiveOrangeRadialGradient');
    const baseTime = game.ticker.elapsedScaledUniform.add(hash(instanceIndex).mul(999));
    const flyOffset = vec3(sin(baseTime.mul(0.4)).mul(0.5), sin(baseTime).mul(0.2), sin(baseTime.mul(0.3)).mul(0.5));
    material.positionNode = instancedArray(positions, 'vec3').toAttribute().add(flyOffset);
    material.scaleNode = this.#firefliesScale;

    const mesh = new THREE.Mesh(new THREE.CircleGeometry(FIREFLY_SIZE, FIREFLY_SEGMENTS), material);
    mesh.count = positions.length / 3;
    mesh.frustumCulled = false;
    game.scene.add(mesh);
  }

  #setLit(isNight: boolean): void {
    this.#glass.visible = isNight;
    gsap.to(this.#firefliesScale, { value: isNight ? 1 : 0, duration: FADE_DURATION, overwrite: true });
  }
}
