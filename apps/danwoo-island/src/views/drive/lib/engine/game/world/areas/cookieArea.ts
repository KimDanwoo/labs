import gsap from 'gsap';
import { float, Fn, positionGeometry, texture, uniform, uv, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '@views/drive/lib/engine/game/audioItem';
import { InstancedGroup, type InstanceReference } from '@views/drive/lib/engine/game/instancedGroup';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import {
  BANNER_WIND_DIRECTION,
  type Coconut,
  COCONUT_MASS,
  HEAT_PULSE,
  HIDDEN_LIFT,
  IMPULSE_DELAY_FRAMES,
  ON_TABLE,
  SPAWNABLE,
  TABLE_STACK,
} from '@views/drive/lib/engine/game/world/areas/cookieAreaConfig';
import { createEmbers, createOvenHeat } from '@views/drive/lib/engine/game/world/areas/cookieEffects';
import { COCONUT_SIZE, makeCoconut, rebuildVillageProps } from '@views/drive/lib/engine/game/world/islandVillage';
import { rebuildCookieCart } from '@views/drive/lib/engine/game/world/villageStructures';

export class CookieArea extends Area {
  readonly cookies: { instancedGroup: InstancedGroup };
  readonly #localTime = uniform(0);
  readonly #ding: AudioItem;
  readonly #blower: THREE.Object3D;
  readonly #ovenHeat: THREE.Object3D;
  readonly #spawnerPosition: THREE.Vector3;
  readonly #coconuts: Coconut[];
  #currentIndex = 0;
  #visibleCount = 0;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#ding = this.game.audio.register({
      path: 'sounds/ding/Cash Register 03.mp3',
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 0.15,
      onPlay: (item) => {
        item.volume = 0.3 + Math.random() * 0.2;
        item.rate = 1 + Math.random() * 0.05;
      },
    });
    this.#blower = this.requireReference('blower');
    this.#waveBanner();
    createEmbers(this, this.#localTime);
    this.#ovenHeat = createOvenHeat(this);
    this.#spawnerPosition = this.requireReference('spawner').position;
    const baseCoconut = this.#prepareBaseCoconut();
    this.#coconuts = Array.from({ length: SPAWNABLE + ON_TABLE }, (_, index) => this.#createCoconut(index));
    this.cookies = {
      instancedGroup: new InstancedGroup(
        this.#coconuts.map(({ reference }) => reference),
        baseCoconut,
      ),
    };
    this.#createInteractivePoint();
  }

  override setObjects(): void {
    rebuildVillageProps(this.model);
    makeCoconut(this.model.children.find((child) => child.name === 'refCookie'));
    rebuildCookieCart(this.model);
    super.setObjects();
  }

  #waveBanner(): void {
    const banner = this.requireReference('banner');
    if (!(banner instanceof THREE.Mesh)) return;
    if (!(banner.material instanceof THREE.NodeMaterial)) return;
    const { ticker, noises, wind } = this.game;
    const windStrength = float(0).toVarying();
    banner.material.positionNode = Fn(() => {
      const baseUv = uv();
      const newPosition = positionGeometry.toVar();
      const windUv = baseUv.mul(vec2(0.35, 0.175)).sub(vec2(0.1, 0.05).mul(ticker.elapsedScaledUniform));
      windStrength.assign(texture(noises.perlin, windUv).r.mul(baseUv.y).mul(wind.strength));
      newPosition.addAssign(BANNER_WIND_DIRECTION.mul(windStrength));
      return newPosition;
    })();
  }

  #prepareBaseCoconut(): THREE.Object3D {
    const base = this.requireReference('cookie');
    base.castShadow = true;
    base.receiveShadow = true;
    base.frustumCulled = true;
    base.position.set(0, 0, 0);
    this.game.materials.updateObject(base);
    return base;
  }

  #createCoconut(index: number): Coconut {
    const isOnTable = index >= SPAWNABLE;
    const reference: InstanceReference = new THREE.Object3D();
    if (isOnTable) {
      reference.position.copy(this.requireReference('table').position);
      reference.position.y += (index - SPAWNABLE) * TABLE_STACK;
    } else {
      reference.position.copy(this.#spawnerPosition);
      reference.position.y += HIDDEN_LIFT;
    }
    reference.needsUpdate = true;
    const object = this.game.objects.add(
      { model: reference, updateMaterials: false, castShadow: false, receiveShadow: false, parent: null },
      {
        type: 'dynamic',
        position: reference.position,
        rotation: reference.quaternion,
        friction: 0.7,
        sleeping: true,
        enabled: isOnTable,
        mass: COCONUT_MASS,
        colliders: [{ shape: 'cylinder', parameters: [COCONUT_SIZE.y / 2, COCONUT_SIZE.x / 2], category: 'object' }],
        waterGravityMultiplier: -1,
      },
    );
    return { reference, object };
  }

  #createInteractivePoint(): void {
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: this.requireReference('interactivePoint').position,
      text: '코코넛 따기',
      align: 'right',
      state: 'concealed',
      onInteract: () => this.accept(),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  accept(): void {
    const body = this.#coconuts[this.#currentIndex]?.object.physical?.body;
    if (!body) return;
    const spawn = this.#spawnerPosition.clone();
    spawn.z += Math.random() - 0.5;
    body.setTranslation(spawn, false);
    body.setEnabled(true);
    this.game.ticker.wait(IMPULSE_DELAY_FRAMES, () => {
      const impulse = {
        x: (Math.random() - 0.5) * COCONUT_MASS * 2,
        y: Math.random() * COCONUT_MASS * 3,
        z: COCONUT_MASS * 7,
      };
      body.applyImpulse(impulse, true);
      body.applyTorqueImpulse({ x: 0, y: 0, z: 0 }, true);
    });

    this.#currentIndex = (this.#currentIndex + 1) % SPAWNABLE;
    this.#visibleCount = Math.min(this.#visibleCount + 1, SPAWNABLE);
    this.#ovenHeat.scale.z = HEAT_PULSE.scale;
    gsap.to(this.#ovenHeat.scale, {
      z: 1,
      overwrite: true,
      duration: HEAT_PULSE.duration,
      delay: HEAT_PULSE.delay,
      ease: 'power1.inOut',
    });
    this.#ding.play();
  }

  override update(): void {
    const { ticker } = this.game;
    const timeScale = (Math.sin(ticker.elapsedScaled) * 0.3 + 0.5) * 0.3;
    this.#localTime.value += ticker.deltaScaled * timeScale;
    this.#blower.scale.y = Math.sin(ticker.elapsedScaled + Math.PI) * 0.25 + 0.75;

    const bodies = this.#coconuts.map(({ object }) => object.physical?.body);
    const isAnyCoconutAwake = this.#visibleCount && !bodies.every((body) => body?.isSleeping() ?? true);
    if (isAnyCoconutAwake) {
      this.cookies.instancedGroup.updateBoundings();
    }
    for (const [index, body] of bodies.entries()) {
      const coconut = this.#coconuts[index];
      const isAwakeCoconut = coconut && body && !body.isSleeping() && body.isEnabled();
      if (isAwakeCoconut) coconut.reference.needsUpdate = true;
    }
  }

  refreshAfterReset(): void {
    this.cookies.instancedGroup.needsUpdate = true;
  }
}
