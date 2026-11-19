import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import { InstancedGroup, type InstanceReference } from '../../instancedGroup';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';
import {
  type Fan,
  FAN_COUNT,
  FAN_FLIGHT,
  FAN_HALF_SIZE,
  FAN_HIDDEN_LIFT,
  FAN_MASS,
  FAN_SPREAD,
  FAN_SWAY,
  LINK_ELEVATION,
  LINK_MODELS,
  RESET_SETTLE_FRAMES,
  UNLINKED_SIGNS,
} from './socialAreaConfig';
import { personalizeSocialSigns, recordSteleFrames, reshapeSocialPlaza } from './socialSigns';

export class SocialArea extends Area {
  readonly fans: { instancedGroup: InstancedGroup };
  readonly #fans: Fan[];
  readonly #spawnerPosition: THREE.Vector3;
  readonly #velocity = { x: 0, y: 0, z: 0 };
  readonly #spin = { x: 0, y: 0, z: 0 };
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
    for (const sign of this.model.children.filter((child) => UNLINKED_SIGNS.test(child.name))) sign.removeFromParent();
    rebuildVillageProps(this.model);
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
    return { reference, object, flight: null };
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
    const fan = this.#fans[this.#currentFan];
    const body = fan?.object.physical?.body;
    if (!fan || !body) return;
    const spread = (): number => (Math.random() - 0.5) * FAN_SPREAD.horizontal;
    const spawn = this.#spawnerPosition.clone().add(new THREE.Vector3(spread(), FAN_SPREAD.lift, spread()));
    body.setTranslation(spawn, false);
    body.setEnabled(true);
    body.setGravityScale(0, false);
    body.wakeUp();
    fan.flight = {
      launchedAt: this.game.ticker.elapsed,
      phase: Math.random() * Math.PI * 2,
      heading: Math.random() * Math.PI * 2,
      spin: FAN_FLIGHT.spin * (Math.random() < 0.5 ? -1 : 1),
    };
    this.#sway(fan);
    this.#currentFan = (this.#currentFan + 1) % FAN_COUNT;
    this.#visibleFans = Math.min(this.#visibleFans + 1, FAN_COUNT);
    this.game.audio.groups.get('click')?.play(true);
  }

  #sway({ object, flight }: Fan): void {
    const body = object.physical?.body;
    if (!body || !flight) return;
    const angle = (this.game.ticker.elapsed - flight.launchedAt) * FAN_SWAY.frequency + flight.phase;
    const side = Math.sin(angle) * FAN_SWAY.amplitude;
    const tilt = Math.cos(angle) * FAN_SWAY.tilt;
    const sideX = Math.cos(flight.heading);
    const sideZ = Math.sin(flight.heading);
    this.#velocity.x = sideX * side;
    this.#velocity.y = FAN_FLIGHT.rise;
    this.#velocity.z = sideZ * side;
    this.#spin.x = -sideZ * tilt;
    this.#spin.y = flight.spin;
    this.#spin.z = sideX * tilt;
    body.setLinvel(this.#velocity, true);
    body.setAngvel(this.#spin, true);
  }

  #landFan(fan: Fan): void {
    const body = fan.object.physical?.body;
    if (!body) return;
    body.setEnabled(false);
    body.setGravityScale(1, false);
    body.setTranslation(this.#spawnerPosition.clone().setY(this.#spawnerPosition.y + FAN_HIDDEN_LIFT), false);
    fan.object.needsUpdate = true;
    fan.flight = null;
    this.#visibleFans = Math.max(this.#visibleFans - 1, 0);
  }

  #hasFlownAway({ flight }: Fan): boolean {
    return flight !== null && this.game.ticker.elapsed - flight.launchedAt > FAN_FLIGHT.lifetime;
  }

  override update(): void {
    for (const fan of this.#fans) {
      if (this.#hasFlownAway(fan)) this.#landFan(fan);
      else this.#sway(fan);
    }
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
    for (const fan of this.#fans.filter(({ flight }) => flight !== null)) this.#landFan(fan);
    this.game.ticker.wait(RESET_SETTLE_FRAMES, () => {
      for (const { object } of this.#fans) object.physical?.body.setEnabled(false);
    });
    this.fans.instancedGroup.needsUpdate = true;
  }
}
