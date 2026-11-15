import type { RigidBody } from '@dimforge/rapier3d-compat';
import gsap from 'gsap';
import { color, Fn, positionGeometry, step, texture, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { type AudioItem, moveSoundTo } from '../../audio';
import { InstancedGroup, type InstanceReference } from '../../instancedGroup';
import type { InteractivePoint } from '../../interactivePoints';
import { JukeboxStation } from '../../jukebox/jukeboxStation';
import { objectOf, type WorldObject } from '../../objects';
import { clamp, remapClamp } from '../../utilities/maths';
import { rebuildBowlingScreenStand } from '../islandReskins';
import { rebuildBowlingSign, rebuildJukebox } from '../islandStructures';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';

interface Pin {
  readonly index: number;
  readonly group: InstanceReference;
  readonly object: WorldObject;
  readonly body: RigidBody;
  readonly basePosition: THREE.Vector3;
  readonly baseRotation: THREE.Quaternion;
  isDown: boolean;
  isSleeping: boolean;
}

interface Ball {
  readonly body: RigidBody;
  readonly basePosition: THREE.Vector3;
  readonly position: THREE.Vector3;
  isSleeping: boolean;
  speed: number;
}

interface Screen {
  readonly group: THREE.Object3D;
  readonly object: WorldObject;
  readonly min: number;
  readonly max: number;
  readonly labelStrike: THREE.Object3D;
  readonly pinStates: Uint8Array;
  readonly dataTexture: THREE.DataTexture;
  x: number;
}

interface Bumpers {
  readonly mesh: THREE.Object3D;
  readonly body: RigidBody;
  readonly object: WorldObject;
  readonly height: number;
  progress: number;
  isActive: boolean;
}

const PIN_SLOTS = 10;
const PIN_DOWN_UP_Y = 0.5;
const PIN_DOWN_VALUE = 128;
const PIN_MASS = 0.02;
const SLEEP_DELAY_FRAMES = 2;
const BOUNDING_INTERVAL = 0.2;
const SCREEN = { travel: 28.2 - 3.81, easing: 2, offset: 0.1, activeTolerance: 0.1 } as const;
const STRIKE_BLINK = { period: 3, visible: 1.5 } as const;
const STRIKE_CONFETTI_OFFSETS = [new THREE.Vector3(-1, -1, 0), new THREE.Vector3(-3.4, -1, 0)] as const;
const BUMPER_DURATION = 1;
const ZERO = { x: 0, y: 0, z: 0 } as const;

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return object instanceof THREE.Mesh;
}

function resetBody(body: RigidBody, position: THREE.Vector3, rotation?: THREE.Quaternion): void {
  body.setTranslation(position, false);
  if (rotation) body.setRotation(rotation, false);
  body.resetForces(false);
  body.resetTorques(false);
  body.setLinvel(ZERO, false);
  body.setAngvel(ZERO, false);
}

function requireBody(object: WorldObject): RigidBody {
  const body = object.physical?.body;
  if (!body) throw new Error('Bowling object has no physical body');
  return body;
}

function screenTexture(): { pinStates: Uint8Array; dataTexture: THREE.DataTexture } {
  const pinStates = new Uint8Array(PIN_SLOTS);
  const dataTexture = new THREE.DataTexture(
    pinStates,
    PIN_SLOTS,
    1,
    THREE.RedFormat,
    THREE.UnsignedByteType,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.NearestFilter,
    THREE.NearestFilter,
  );
  dataTexture.needsUpdate = true;
  return { pinStates, dataTexture };
}

function pinIndicatorMaterial(
  dataTexture: THREE.DataTexture,
  { hex, strength, threshold }: { hex: string; strength: number; threshold: number },
): THREE.MeshBasicNodeMaterial {
  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = vec4(uniform(color(hex)).mul(uniform(strength)), 1);
  material.positionNode = Fn(() => {
    const isActive = step(texture(dataTexture, uv()).r.sub(threshold).abs(), SCREEN.activeTolerance);
    const newPosition = positionGeometry.toVar();
    newPosition.z.subAssign(isActive.oneMinus().mul(SCREEN.offset));
    return newPosition;
  })();
  return material;
}

function strikeLabelMaterial(label: THREE.Object3D): THREE.MeshBasicNodeMaterial {
  const map = isMesh(label) && !Array.isArray(label.material) ? Reflect.get(label.material, 'map') : null;
  if (!(map instanceof THREE.Texture)) throw new Error('Bowling strike label has no texture');
  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = Fn(() => {
    texture(map).r.lessThan(0.5).discard();
    return vec4(vec3(2), 1);
  })();
  return material;
}

export class BowlingArea extends Area {
  readonly #sounds: { strike: AudioItem; pin: AudioItem };
  readonly #pins: Pin[];
  readonly #pinGroup: InstancedGroup;
  readonly #ball: Ball;
  readonly #screen: Screen;
  readonly #restartPoint: InteractivePoint;
  readonly jukebox: JukeboxStation;
  #isWon = false;
  #wonTime = 0;
  #pinsAllSleeping = true;
  #boundingUpdateTime = 0;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#sounds = this.#registerSounds();
    const { pins, group } = this.#createPins();
    this.#pins = pins;
    this.#pinGroup = group;
    this.#ball = this.#createBall();
    this.#restartPoint = this.#createRestartPoint();
    this.#screen = this.#createScreen();
    this.#createBumpers();
    this.jukebox = new JukeboxStation({
      anchor: this.requireReference('jukebox'),
      pointPosition: this.requireReference('jukeboxInteractivePoint').position,
    });
  }

  override setObjects(): void {
    rebuildVillageProps(this.model);
    rebuildBowlingSign(this.model, this.game.texture('bowlingNeonTexture'));
    rebuildJukebox(this.model);
    rebuildBowlingScreenStand(this.model);
    super.setObjects();
  }

  #registerSounds(): { strike: AudioItem; pin: AudioItem } {
    const { audio } = this.game;
    const sounds = {
      strike: audio.register({
        path: 'sounds/achievements/Money Reward 2.mp3',
        autoplay: false,
        loop: false,
        volume: 0.4,
        antiSpam: 1,
      }),
      pin: audio.register({
        path: 'sounds/hits/pins/ComedyCrash 6115_16_4.mp3',
        autoplay: false,
        volume: 0.5,
        antiSpam: 0.05,
        positions: new THREE.Vector3(),
        distanceFade: 35,
        onPlay: (item, force, position) => {
          moveSoundTo(item, position);
          const strength = remapClamp(typeof force === 'number' ? force : 0, [3, 10], [0, 1]);
          item.volume = strength * 0.5;
          item.rate = 1.2 - strength * 0.2;
        },
      }),
    };
    this.#registerRollingSound();
    return sounds;
  }

  #registerRollingSound(): void {
    this.game.audio.register({
      path: 'sounds/rolling/06290 medium ball rolling lp.mp3',
      autoplay: true,
      loop: true,
      volume: 0.5,
      rate: 0.8,
      positions: new THREE.Vector3(),
      distanceFade: 25,
      onPlaying: (item) => {
        item.firstPosition().copy(this.#ball.position);
        item.volume = remapClamp(this.#ball.speed, [0, 5], [0, 0.6]);
      },
    });
  }

  #createPins(): { pins: Pin[]; group: InstancedGroup } {
    const references = InstancedGroup.getReferencesFromChildren(this.requireReference('pinPositions').children);
    const basePin = this.requireReference('pinPhysicalDynamic');
    basePin.castShadow = true;
    basePin.receiveShadow = true;
    basePin.position.set(0, 0, 0);
    basePin.rotation.set(0, 0, 0);
    this.game.materials.updateObject(basePin);
    const colliders = this.game.objects.getFromModel(basePin)[1]?.colliders ?? [];

    const pins = references.map((group, index): Pin => {
      const object = this.game.objects.add(
        { model: group, updateMaterials: false, parent: null },
        {
          type: 'dynamic',
          position: group.position,
          rotation: group.quaternion,
          friction: 0.5,
          linearDamping: 0.1,
          angularDamping: 0.5,
          sleeping: true,
          colliders,
          waterGravityMultiplier: -1,
          mass: PIN_MASS,
          contactThreshold: 5,
          onCollision: (force, position) => this.#sounds.pin.play(force, position),
        },
      );
      return {
        index,
        group,
        object,
        body: requireBody(object),
        basePosition: group.position.clone(),
        baseRotation: group.quaternion.clone(),
        isDown: false,
        isSleeping: true,
      };
    });
    return { pins, group: new InstancedGroup(references, basePin) };
  }

  #createBall(): Ball {
    const reference = this.requireReference('ball');
    const body = requireBody(objectOf(reference));
    return {
      body,
      basePosition: reference.position.clone(),
      position: new THREE.Vector3().copy(body.translation()),
      isSleeping: true,
      speed: 0,
    };
  }

  #sleepAfterReset(body: RigidBody): void {
    this.game.ticker.wait(SLEEP_DELAY_FRAMES, () => body.sleep());
  }

  #resetPins(): void {
    for (const pin of this.#pins) {
      pin.isDown = false;
      resetBody(pin.body, pin.basePosition, pin.baseRotation);
      this.#sleepAfterReset(pin.body);
    }
  }

  #resetBall(): void {
    resetBody(this.#ball.body, this.#ball.basePosition);
    this.#sleepAfterReset(this.#ball.body);
  }

  #resetScreen(): void {
    for (const pin of this.#pins) this.#screen.pinStates[pin.index] = 0;
    this.#screen.dataTexture.needsUpdate = true;
  }

  restart(): void {
    this.#isWon = false;
    this.#resetPins();
    this.#resetBall();
    this.#resetScreen();
    this.#pinGroup.needsUpdate = true;
    this.game.ticker.wait(1, () => this.#restartPoint.hide());
    this.game.audio.groups.get('click')?.play(true);
  }

  #createRestartPoint(): InteractivePoint {
    const { interactiveButtons } = this.game.inputs;
    return this.game.interactivePoints.create({
      position: this.requireReference('restartInteractivePoint').position,
      text: '다시 하기',
      align: 'right',
      state: 'hidden',
      onInteract: () => this.restart(),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #createScreen(): Screen {
    const group = this.requireReference('screen');
    const { pinStates, dataTexture } = screenTexture();
    const discs = this.requireReference('discs');
    const crosses = this.requireReference('crosses');
    if (isMesh(discs))
      discs.material = pinIndicatorMaterial(dataTexture, { hex: '#ffffff', strength: 2, threshold: 0 });
    if (isMesh(crosses)) {
      crosses.material = pinIndicatorMaterial(dataTexture, { hex: '#ff2b11', strength: 6, threshold: 0.5 });
    }

    const labelStrike = this.requireReference('labelStrike');
    if (isMesh(labelStrike)) labelStrike.material = strikeLabelMaterial(labelStrike);
    labelStrike.visible = false;

    const max = group.position.x;
    return {
      group,
      object: objectOf(group),
      min: max - SCREEN.travel,
      max,
      labelStrike,
      pinStates,
      dataTexture,
      x: max,
    };
  }

  #createBumpers(): void {
    const mesh = this.requireReference('bumpers');
    const object = objectOf(mesh);
    const body = requireBody(object);
    for (const index of [0, 1]) {
      body.collider(index).setRestitution(1);
      body.collider(index).setFriction(0);
    }
    const bumpers: Bumpers = { mesh, body, object, height: Math.abs(mesh.position.y), progress: 0, isActive: false };

    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: this.requireReference('bumpersInteractivePoint').position,
      text: '범퍼',
      align: 'left',
      state: 'concealed',
      onInteract: () => this.#toggleBumpers(bumpers),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #toggleBumpers(bumpers: Bumpers): void {
    bumpers.isActive = !bumpers.isActive;
    gsap.to(bumpers, {
      progress: bumpers.isActive ? 1 : 0,
      duration: BUMPER_DURATION,
      overwrite: true,
      onUpdate: () => {
        bumpers.body.setNextKinematicTranslation({
          x: bumpers.mesh.position.x,
          y: -(1 - bumpers.progress) * bumpers.height,
          z: bumpers.mesh.position.z,
        });
        bumpers.object.needsUpdate = true;
      },
    });
    this.game.player.sounds.suspensions.play();
  }

  #updateScreen(): void {
    const { player, ticker } = this.game;
    const screen = this.#screen;
    const targetX = clamp(player.position.x, screen.min, screen.max);
    screen.x += (targetX - screen.x) * ticker.deltaScaled * SCREEN.easing;
    screen.object.physical?.body.setNextKinematicTranslation({
      x: screen.x,
      y: screen.group.position.y,
      z: screen.group.position.z,
    });
    screen.object.needsUpdate = true;
    screen.labelStrike.visible =
      this.#isWon && (ticker.elapsedScaled - this.#wonTime) % STRIKE_BLINK.period < STRIKE_BLINK.visible;
  }

  #updatePins(): { hasWoken: boolean; hasFallen: boolean } {
    let hasWoken = false;
    let hasFallen = false;
    this.#pinsAllSleeping = true;
    for (const pin of this.#pins) {
      const isDown = new THREE.Vector3(0, 1, 0).applyQuaternion(pin.group.quaternion).y < PIN_DOWN_UP_Y;
      if (isDown && !pin.isDown) {
        pin.isDown = true;
        hasFallen = true;
        this.#screen.pinStates[pin.index] = PIN_DOWN_VALUE;
      }

      const isSleeping = pin.body.isSleeping();
      this.#pinsAllSleeping &&= isSleeping;
      if (isSleeping !== pin.isSleeping) {
        pin.isSleeping = isSleeping;
        if (!isSleeping) hasWoken = true;
      }
    }
    return { hasWoken, hasFallen };
  }

  #celebrateStrike(): void {
    const { ticker, world, player } = this.game;
    this.#isWon = true;
    this.#wonTime = ticker.elapsedScaled;
    this.#sounds.strike.play();
    const confetti = world.confetti;
    if (!confetti) return;
    confetti.pop(player.position.clone());
    for (const offset of STRIKE_CONFETTI_OFFSETS) confetti.pop(this.#screen.group.position.clone().add(offset));
  }

  #updateBoundings(): void {
    const { elapsed } = this.game.ticker;
    if (elapsed <= this.#boundingUpdateTime + BOUNDING_INTERVAL) return;
    this.#boundingUpdateTime = elapsed;
    if (!this.#pinsAllSleeping) this.#pinGroup.updateBoundings();
  }

  #updateBall(): boolean {
    const ball = this.#ball;
    const isSleeping = ball.body.isSleeping();
    const hasWoken = isSleeping !== ball.isSleeping && !isSleeping;
    ball.isSleeping = isSleeping;
    if (isSleeping) {
      ball.speed = 0;
      return hasWoken;
    }
    const position = new THREE.Vector3().copy(ball.body.translation());
    ball.speed = position.distanceTo(ball.position) / this.game.ticker.delta;
    ball.position.copy(position);
    return hasWoken;
  }

  override update(): void {
    this.#updateScreen();
    const pins = this.#updatePins();
    if (pins.hasFallen) {
      this.#screen.dataTexture.needsUpdate = true;
      if (!this.#isWon && this.#pins.every((pin) => pin.isDown)) this.#celebrateStrike();
    }
    this.#updateBoundings();
    const hasBallWoken = this.#updateBall();
    if ((pins.hasWoken || hasBallWoken) && this.#restartPoint.state === 'hidden') this.#restartPoint.show();
  }
}
