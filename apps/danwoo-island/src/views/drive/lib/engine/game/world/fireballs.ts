import type { Vector } from '@dimforge/rapier3d-compat';
import gsap from 'gsap';
import {
  add,
  color,
  Fn,
  mix,
  normalGeometry,
  positionGeometry,
  positionWorld,
  step,
  texture,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';

interface FireballOptions {
  fireRadius?: number;
  explosionRadius?: number;
}

const DEFAULT_RADIUS = 5;
const EXPLOSION_STRENGTH = 8;
const LIFETIME = 2.25;
const NOISE_SCALE = 0.8;
const GOO_THRESHOLD = 0.1;

export class Fireballs {
  readonly #geometry = new THREE.SphereGeometry(0.5, 12, 6);
  readonly #colorA = uniform(color('red'));
  readonly #colorB = uniform(color('orange'));
  readonly #strength = uniform(8);

  create(
    coordinates: Vector,
    { fireRadius = DEFAULT_RADIUS, explosionRadius = DEFAULT_RADIUS }: FireballOptions = {},
  ): void {
    const game = getGame();
    const progress = uniform(0.5);
    const material = new THREE.MeshBasicNodeMaterial({ wireframe: false });
    material.outputNode = this.#outputNode(progress);

    const mesh = new THREE.Mesh(this.#geometry, material);
    mesh.position.copy(coordinates);
    mesh.rotation.reorder('XYZ');
    mesh.rotation.x = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    game.scene.add(mesh);

    const scale = { value: 0 };
    gsap.fromTo(
      scale,
      { value: 0.5 },
      {
        value: fireRadius,
        duration: 0.6,
        delay: 0,
        ease: 'power3.out',
        onUpdate: () => mesh.scale.setScalar(scale.value),
      },
    );
    gsap.fromTo(mesh.rotation, { z: 0 }, { z: -1, duration: LIFETIME, delay: 0, ease: 'linear' });
    gsap.fromTo(progress, { value: 0.15 }, { value: 1, duration: 2, delay: 0.25, ease: 'linear' });
    game.explosions.explode(new THREE.Vector3().copy(coordinates), {
      radius: explosionRadius,
      strength: EXPLOSION_STRENGTH,
    });
    gsap.delayedCall(LIFETIME, () => {
      mesh.removeFromParent();
      material.dispose();
    });
  }

  #outputNode(progress: THREE.UniformNode<'float', number>): THREE.Node<'vec4'> {
    const { noises, fog } = getGame();
    return Fn(() => {
      const noiseX = texture(noises.perlin, positionGeometry.yz.mul(NOISE_SCALE), 1).r;
      const noiseY = texture(noises.perlin, positionGeometry.xz.mul(NOISE_SCALE).add(0.8), 1).r;
      const noiseZ = texture(noises.perlin, positionGeometry.xy.mul(NOISE_SCALE).add(1.6), 1).r;
      const blending = normalGeometry.abs().normalize();
      blending.assign(blending.div(blending.x.add(blending.y).add(blending.z)));

      const noise = add(noiseX.mul(blending.x), noiseY.mul(blending.y), noiseZ.mul(blending.z))
        .remap(0.15, 0.9, 0, 1)
        .toVar();
      noise.mulAssign(positionWorld.y.mul(2).clamp(0, 1));
      noise.subAssign(progress);

      const emissiveColor = mix(this.#colorA, this.#colorB, noise);
      emissiveColor.mulAssign(this.#strength);
      const gooColor = fog.strength.mix(vec3(0), fog.color);
      const finalColor = mix(emissiveColor, gooColor, step(noise, GOO_THRESHOLD));
      noise.lessThan(0).discard();
      return vec4(vec3(finalColor), 1);
    })();
  }
}
