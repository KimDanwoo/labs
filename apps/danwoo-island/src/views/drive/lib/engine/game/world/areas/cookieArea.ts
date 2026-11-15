import gsap from 'gsap';
import {
  color,
  float,
  Fn,
  instancedArray,
  mix,
  positionGeometry,
  step,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '../../audio';
import { InstancedGroup, type InstanceReference } from '../../instancedGroup';
import type { WorldObject } from '../../objects';
import { rebuildCookieCart } from '../islandStructures';
import { COCONUT_SIZE, makeCoconut, rebuildVillageProps } from '../islandVillage';
import { Area } from './area';

interface Coconut {
  reference: InstanceReference;
  object: WorldObject;
}

const SPAWNABLE = 20;
const ON_TABLE = 2;
const COCONUT_MASS = 0.02;
const TABLE_STACK = 0.25;
const HIDDEN_LIFT = 99;
const EMBERS = { count: 30, elevation: 3, radius: 0.4, size: 0.015, segments: 8, hideAt: 0.8, hideLift: 100 } as const;
const EMBER_BOUNDS = { centerY: 1, radius: 1, delayFrames: 2 } as const;
const BANNER_WIND_DIRECTION = vec3(0.5, 0, 1);
const IMPULSE_DELAY_FRAMES = 2;
const HEAT_PULSE = { scale: 2, duration: 2, delay: 0.2 } as const;

function emberData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(EMBERS.count * 3);
  const scales = new Float32Array(EMBERS.count);
  for (let index = 0; index < EMBERS.count; index += 1) {
    const angle = Math.PI * 2 * Math.random();
    const radius = Math.random() ** 1.5 * EMBERS.radius;
    positions.set([Math.cos(angle) * radius, Math.random(), Math.sin(angle) * radius], index * 3);
    scales[index] = Math.random() * 1 + 0.75;
  }
  return { positions, scales };
}

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
    this.#createEmbers();
    this.#ovenHeat = this.#createOvenHeat();
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
    rebuildVillageProps(this.model, this.game.materials);
    makeCoconut(
      this.model.children.find((child) => child.name === 'refCookie'),
      this.game.materials,
    );
    rebuildCookieCart(this.model, this.game.materials);
    super.setObjects();
  }

  #waveBanner(): void {
    const banner = this.requireReference('banner');
    if (!(banner instanceof THREE.Mesh) || !(banner.material instanceof THREE.NodeMaterial)) return;
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

  #createEmbers(): void {
    const { positions, scales } = emberData();
    const positionAttribute = instancedArray(positions, 'vec3').toAttribute();
    const scaleAttribute = instancedArray(scales, 'float').toAttribute();
    const elevation = uniform(EMBERS.elevation);
    const material = new THREE.SpriteNodeMaterial();
    material.outputNode = this.game.materials.emissiveOutput('emissiveOrangeRadialGradient');

    const progress = float(0).toVar();
    material.positionNode = Fn(() => {
      const newPosition = positionAttribute.toVar();
      progress.assign(newPosition.y.add(this.#localTime.mul(newPosition.y)).fract());
      newPosition.y.assign(progress.mul(elevation));
      newPosition.y.addAssign(step(EMBERS.hideAt, progress).mul(EMBERS.hideLift));
      return newPosition;
    })();
    material.scaleNode = Fn(() => scaleAttribute.mul(progress.remapClamp(0.5, 1, 1, 0)))();

    const mesh = new THREE.Mesh(new THREE.CircleGeometry(EMBERS.size, EMBERS.segments), material);
    mesh.position.copy(this.requireReference('chimney').position);
    mesh.count = EMBERS.count;
    this.game.scene.add(mesh);

    let needsBounds = true;
    this.events.on('frustumIn', () => {
      if (!needsBounds) return;
      needsBounds = false;
      this.game.ticker.wait(EMBER_BOUNDS.delayFrames, () => {
        const bounds = mesh.geometry.boundingSphere;
        if (!bounds) return;
        bounds.center.y = EMBER_BOUNDS.centerY;
        bounds.radius = EMBER_BOUNDS.radius;
      });
    });
    this.objects.hideable.push(mesh);
  }

  #createOvenHeat(): THREE.Object3D {
    const { ticker, noises } = this.game;
    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    material.outputNode = Fn(() => {
      const noiseUv = uv().mul(vec2(2, 0.2));
      noiseUv.y.addAssign(ticker.elapsedScaledUniform.mul(0.05));
      const strength = texture(noises.perlin, noiseUv).r.mul(uv().y.pow(2));
      const emissiveColor = mix(color('#ff3e00'), color('#ff8641'), strength.smoothstep(0, 0.5)).mul(
        strength.add(1).mul(2),
      );
      return vec4(vec3(emissiveColor), strength);
    })();
    const ovenHeat = this.requireReference('ovenHeat');
    if (ovenHeat instanceof THREE.Mesh) ovenHeat.material = material;
    ovenHeat.castShadow = false;
    return ovenHeat;
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
    if (this.#visibleCount && !bodies.every((body) => body?.isSleeping() ?? true)) {
      this.cookies.instancedGroup.updateBoundings();
    }
    for (const [index, body] of bodies.entries()) {
      const coconut = this.#coconuts[index];
      if (coconut && body && !body.isSleeping() && body.isEnabled()) coconut.reference.needsUpdate = true;
    }
  }

  refreshAfterReset(): void {
    this.cookies.instancedGroup.needsUpdate = true;
  }
}
