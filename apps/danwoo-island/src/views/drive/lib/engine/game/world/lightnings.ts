import gsap from 'gsap';
import { alea } from 'seedrandom';
import { color, instancedArray, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { type AudioItem } from '@views/drive/lib/engine/game/audioItem';
import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { LineGeometry } from '@views/drive/lib/engine/game/geometries/lineGeometry';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import {
  anticipationMaterial,
  arcMaterial,
  explosionMaterial,
} from '@views/drive/lib/engine/game/world/lightningMaterials';
import { registerDistantThunder, registerNearThunder } from '@views/drive/lib/engine/game/world/lightningSounds';
import {
  ANTICIPATION,
  anticipationData,
  ARC,
  arcPoints,
  DISTANT_SEED_OFFSET,
  EXPLOSION,
  explosionData,
  pick,
  RENDER_ORDER,
  STRIKE_EXPLOSION,
  type Random,
} from '@views/drive/lib/engine/game/world/lightningsConfig';

export class Lightnings {
  readonly #group = new THREE.Group();
  readonly #colorA = uniform(color('#ff4c00'));
  readonly #colorB = uniform(color('#5180ff'));
  readonly #intensity = uniform(3);
  readonly #palette = { colorA: this.#colorA, colorB: this.#colorB, intensity: this.#intensity };
  readonly #near: AudioItem[];
  readonly #distant: AudioItem[];
  readonly #anticipation: { position: THREE.Node<'vec3'>; scale: THREE.Node<'float'> };
  readonly #arcGeometry: LineGeometry;
  readonly #explosion: { position: THREE.Node<'vec3'>; scale: THREE.Node<'float'> };
  readonly #anticipationGeometry = new THREE.PlaneGeometry(1, 1);
  readonly #explosionGeometry = new THREE.PlaneGeometry();
  #currentSecond = Math.floor(Date.now() / 1000);

  constructor() {
    const game = getGame();
    game.scene.add(this.#group);
    this.#near = registerNearThunder();
    this.#distant = registerDistantThunder();
    const anticipation = anticipationData();
    this.#anticipation = {
      position: instancedArray(anticipation.positions, 'vec3').toAttribute(),
      scale: instancedArray(anticipation.scales, 'float').toAttribute(),
    };
    this.#arcGeometry = new LineGeometry(arcPoints());
    const explosion = explosionData();
    this.#explosion = {
      position: instancedArray(explosion.positions, 'vec3').toAttribute(),
      scale: instancedArray(explosion.scales, 'float').toAttribute(),
    };
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.lightnings);
  }

  #createAnticipation(coordinates: THREE.Vector3, random: Random): THREE.Mesh {
    const material = anticipationMaterial(this.#palette, this.#anticipation);
    const mesh = new THREE.Mesh(this.#anticipationGeometry, material);
    mesh.position.copy(coordinates);
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.count = ANTICIPATION.count;
    mesh.renderOrder = RENDER_ORDER;
    this.#group.add(mesh);
    return mesh;
  }

  #createArc(coordinates: THREE.Vector3, random: Random): THREE.Mesh {
    const material = arcMaterial(this.#palette, coordinates);
    const mesh = new THREE.Mesh(this.#arcGeometry, material);
    mesh.position.copy(coordinates);
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.renderOrder = RENDER_ORDER;
    this.#group.add(mesh);
    return mesh;
  }

  #createExplosion(coordinates: THREE.Vector3, random: Random): THREE.Mesh {
    const material = explosionMaterial(this.#palette, this.#explosion, coordinates);
    const mesh = new THREE.Mesh(this.#explosionGeometry, material);
    mesh.position.copy(coordinates);
    mesh.count = EXPLOSION.count;
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.renderOrder = RENDER_ORDER;
    this.#group.add(mesh);
    gsap.to(mesh.position, { y: -EXPLOSION.fall, duration: EXPLOSION.duration });
    return mesh;
  }

  createRandom(random: Random): void {
    const { focusPoint, optimalArea } = getGame().view;
    const offset = (): number => (random() - 0.5) * optimalArea.radius * 1;
    const x = focusPoint.position.x + offset();
    const z = focusPoint.position.z + offset();
    this.create(new THREE.Vector3(x, 0, z), random);
  }

  create(coordinates: THREE.Vector3, random: Random): void {
    const disposables: THREE.Mesh[] = [this.#createAnticipation(coordinates, random)];
    gsap.delayedCall(ANTICIPATION.duration, () => {
      pick(this.#near)?.play(coordinates);
      getGame().explosions.explode(coordinates, STRIKE_EXPLOSION);
      disposables.push(this.#createArc(coordinates, random), this.#createExplosion(coordinates, random));
      gsap.delayedCall(Math.max(ARC.duration, EXPLOSION.duration), () => {
        for (const mesh of disposables) {
          mesh.removeFromParent();
          if (mesh.material instanceof THREE.Material) mesh.material.dispose();
        }
      });
    });
  }

  update(): void {
    const second = Math.floor(Date.now() / 1000);
    if (second === this.#currentSecond) return;
    this.#currentSecond = second;

    const { weather } = getGame();
    const hitChances =
      Math.max(0, weather.clouds.value) * Math.max(0, weather.electricField.value) * weather.humidity.value;
    const strike = alea(String(second));
    if (strike() < hitChances) {
      this.createRandom(strike);
      return;
    }
    if (alea(String(second + DISTANT_SEED_OFFSET))() < hitChances) pick(this.#distant)?.play();
  }
}
