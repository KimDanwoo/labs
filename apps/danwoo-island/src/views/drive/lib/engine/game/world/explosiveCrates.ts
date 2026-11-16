import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { type AudioItem, moveSoundTo } from '../audio';
import { getGame } from '../gameContext';
import { InstancedGroup, type InstanceReference } from '../instancedGroup';
import type { WorldObject } from '../objects';
import { TICK_ORDER } from '../tickOrder';
import { createCoconutCrate } from './islandProps';

interface Crate {
  readonly reference: InstanceReference;
  readonly origin: THREE.Vector3;
  readonly object: WorldObject;
  hasExploded: boolean;
}

const CRATE_HALF_SIZE: [number, number, number] = [0.5, 0.5, 0.5];
const FUSE_DELAY = 0.4;
const HIDDEN_OFFSET = 100;
const REENABLE_DELAY_FRAMES = 2;
const EXPLOSION_PATHS = [
  'sounds/explosions/SmallImpactMediumE PE281202.mp3',
  'sounds/explosions/SmallImpactMediumE PE281203.mp3',
] as const;

function registerSounds(): { trigger: AudioItem; explosions: AudioItem[] } {
  const { audio } = getGame();
  const trigger = audio.register({
    path: 'sounds/clicks/Source Metal Clicks Delicate Light Sharp Clip Mid 07.mp3',
    autoplay: false,
    loop: false,
    volume: 0.4,
    antiSpam: 0.1,
    positions: new THREE.Vector3(),
    onPlay: (item, coordinates) => {
      moveSoundTo(item, coordinates);
      item.volume = 1;
      item.rate = 0.7 + Math.random() * 1.3;
    },
  });
  const explosions = EXPLOSION_PATHS.map((path) =>
    audio.register({
      path,
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 0.2,
      positions: new THREE.Vector3(),
      distanceFade: 25,
      onPlay: (item, coordinates) => {
        moveSoundTo(item, coordinates);
        item.volume = 1;
        item.rate = 0.9 + Math.random() * 0.3;
      },
    }),
  );
  return { trigger, explosions };
}

export class ExplosiveCrates {
  readonly instancedGroup: InstancedGroup;
  readonly #crates: Crate[];
  readonly #sounds: { trigger: AudioItem; explosions: AudioItem[] };

  constructor() {
    const game = getGame();
    const [base, references] = InstancedGroup.getBaseAndReferencesFromInstances(
      game.model('explosiveCratesModel').scene.children,
    );
    base.castShadow = true;
    base.receiveShadow = true;
    game.materials.updateObject(base);
    this.instancedGroup = new InstancedGroup(references, createCoconutCrate());
    this.#crates = references.map((reference) => this.#createCrate(reference));
    this.#sounds = registerSounds();
    game.ticker.events.on('tick', () => this.#markMoving(), TICK_ORDER.explosiveCrates);
  }

  #createCrate(reference: InstanceReference): Crate {
    const origin = reference.clone().position;
    const crate: Crate = {
      reference,
      origin,
      hasExploded: false,
      object: getGame().objects.add(
        { model: reference },
        {
          type: 'dynamic',
          position: reference.position.clone(),
          rotation: reference.quaternion.clone(),
          friction: 0.7,
          mass: 0.02,
          sleeping: true,
          colliders: [{ shape: 'cuboid', parameters: CRATE_HALF_SIZE, category: 'object' }],
          waterGravityMultiplier: -1,
          contactThreshold: 0,
          onCollision: () => this.#explode(crate),
        },
      ),
    };
    return crate;
  }

  #markMoving(): void {
    for (const { reference, object } of this.#crates) {
      const body = object.physical?.body;
      if (body && !body.isSleeping() && body.isEnabled()) reference.needsUpdate = true;
    }
  }

  #explode(crate: Crate): void {
    if (crate.hasExploded) return;
    crate.hasExploded = true;
    this.#sounds.trigger.play(crate.origin);

    gsap.delayedCall(FUSE_DELAY, () => {
      const game = getGame();
      const { explosions } = this.#sounds;
      explosions[Math.floor(Math.random() * explosions.length)]?.play(crate.origin);
      const body = crate.object.physical?.body;
      if (body) game.world.fireballs?.create(body.translation());
      game.objects.disable(crate.object);
      crate.reference.position.y += HIDDEN_OFFSET;
      crate.reference.needsUpdate = true;
    });
  }

  reset(): void {
    const game = getGame();
    for (const crate of this.#crates) {
      game.objects.resetObject(crate.object);
      crate.hasExploded = false;
      game.ticker.wait(REENABLE_DELAY_FRAMES, () => crate.object.physical?.body.setEnabled(true));
    }
    this.instancedGroup.needsUpdate = true;

    for (const { physical } of game.objects.list.values()) {
      if (!physical || !physical.body.isEnabled()) continue;
      if (physical.type !== 'dynamic' && physical.type !== 'kinematicPositionBased') continue;
      physical.body.setEnabled(false);
      game.ticker.wait(1, () => {
        physical.body.setEnabled(true);
        if (physical.initialState.sleeping) physical.body.sleep();
      });
    }
  }
}
