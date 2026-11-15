import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import { InstancedGroup, type InstanceReference } from '../../instancedGroup';
import type { WorldObject } from '../../objects';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';
import { personalizeSocialSigns, recordSteleFrames, reshapeSocialPlaza } from './socialSigns';

interface Fan {
  reference: InstanceReference;
  object: WorldObject;
}

const LINK_MODELS = new Map<string, string>([
  ['GitHub', 'gitHub'],
  ['블로그', 'twitch'],
  ['SoundCloud', 'youtube'],
  ['이력서', 'mail'],
  ['Danwoo Lab', 'x'],
]);
const LINK_ELEVATION = 1;
const FAN_COUNT = 30;
const FAN_MASS = 0.02;
const FAN_HIDDEN_LIFT = 99;
const FAN_HALF_SIZE: [number, number, number] = [0.45, 0.65, 0.45];
const FAN_SPREAD = { horizontal: 4, vertical: 4 } as const;

export class SocialArea extends Area {
  readonly fans: { instancedGroup: InstancedGroup };
  readonly #fans: Fan[];
  readonly #spawnerPosition: THREE.Vector3;
  #currentFan = 0;
  #visibleFans = 0;

  constructor(model: THREE.Object3D) {
    super(model);
    personalizeSocialSigns(this.objects.items);
    this.#createLinks();
    this.#spawnerPosition = this.requireReference('onlyFans').position;
    const baseFan = this.#prepareBaseFan();
    this.#fans = Array.from({ length: FAN_COUNT }, () => this.#createFan());
    this.fans = {
      instancedGroup: new InstancedGroup(
        this.#fans.map(({ reference }) => reference),
        baseFan,
      ),
    };
    this.#createFanSpawner();
  }

  override setObjects(): void {
    rebuildVillageProps(this.model, this.game.materials);
    reshapeSocialPlaza(this.model);
    recordSteleFrames(this.model);
    super.setObjects();
  }

  #interactButtons(): { onReveal: () => void; onConceal: () => void; onHide: () => void } {
    const { interactiveButtons } = this.game.inputs;
    return {
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    };
  }

  #createLinks(): void {
    for (const link of content.social) {
      const modelName = LINK_MODELS.get(link.name);
      const object = this.objects.items.find((item) => item.visual?.object3D.name === modelName);
      if (!object?.visual) continue;
      const position = object.visual.object3D.position.clone();
      position.y = LINK_ELEVATION;
      this.game.interactivePoints.create({
        position,
        text: link.name,
        align: link.align === 'left' ? 'left' : 'right',
        state: 'concealed',
        onInteract: () => window.open(link.url, '_blank', 'noopener,noreferrer'),
        ...this.#interactButtons(),
      });
    }
  }

  #prepareBaseFan(): THREE.Object3D {
    const baseFan = this.requireReference('fan');
    baseFan.castShadow = true;
    baseFan.receiveShadow = true;
    baseFan.position.set(0, 0, 0);
    this.game.materials.updateObject(baseFan);
    baseFan.removeFromParent();
    return baseFan;
  }

  #createFan(): Fan {
    const reference: InstanceReference = new THREE.Object3D();
    reference.position.copy(this.#spawnerPosition);
    reference.position.y += FAN_HIDDEN_LIFT;
    reference.needsUpdate = true;
    const object = this.game.objects.add(
      { model: reference, updateMaterials: false, castShadow: false, receiveShadow: false, parent: null },
      {
        type: 'dynamic',
        position: reference.position,
        rotation: reference.quaternion,
        friction: 0.7,
        mass: FAN_MASS,
        sleeping: true,
        enabled: false,
        colliders: [{ shape: 'cuboid', parameters: FAN_HALF_SIZE, category: 'object' }],
        waterGravityMultiplier: -1,
      },
    );
    return { reference, object };
  }

  #createFanSpawner(): void {
    this.game.interactivePoints.create({
      position: this.#spawnerPosition,
      text: '바람개비',
      align: 'right',
      state: 'concealed',
      onInteract: () => this.#popFan(),
      ...this.#interactButtons(),
    });
  }

  #popFan(): void {
    const body = this.#fans[this.#currentFan]?.object.physical?.body;
    if (!body) return;
    const spawn = this.#spawnerPosition.clone();
    spawn.x += (Math.random() - 0.5) * FAN_SPREAD.horizontal;
    spawn.y += FAN_SPREAD.vertical * Math.random();
    spawn.z += (Math.random() - 0.5) * FAN_SPREAD.horizontal;
    body.setTranslation(spawn, false);
    body.setEnabled(true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    body.wakeUp();
    this.#currentFan = (this.#currentFan + 1) % FAN_COUNT;
    this.#visibleFans = Math.min(this.#visibleFans + 1, FAN_COUNT);
    this.game.audio.groups.get('click')?.play(true);
  }

  override update(): void {
    const bodies = this.#fans.map(({ object }) => object.physical?.body);
    if (this.#visibleFans && !bodies.every((body) => body?.isSleeping() ?? true)) {
      this.fans.instancedGroup.updateBoundings();
    }
    for (const [index, body] of bodies.entries()) {
      const fan = this.#fans[index];
      if (fan && body && !body.isSleeping() && body.isEnabled()) fan.reference.needsUpdate = true;
    }
  }

  refreshAfterReset(): void {
    this.fans.instancedGroup.needsUpdate = true;
  }
}
