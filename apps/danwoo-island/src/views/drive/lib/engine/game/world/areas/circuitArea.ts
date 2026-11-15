import type { RigidBody } from '@dimforge/rapier3d-compat';
import gsap from 'gsap';
import { color, Fn, uniform, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '../../audio';
import type { Action } from '../../inputs/inputs';
import type { InteractivePoint } from '../../interactivePoints';
import { objectOf, type WorldObject } from '../../objects';
import { Player } from '../../player';
import { segmentCircleIntersection } from '../../utilities/maths';
import { requireElement } from '../../utilities/requireElement';
import { replaceAirDancers } from '../islandReskins';
import { rebuildCircuitObjects, rebuildPodium, reshapeCircuitDecoration } from '../islandVillage';
import { Area } from './area';
import { paintCourseSign, paintObstacleResetSign } from './circuitSigns';
import { CircuitTimer } from './circuitTimer';

export type CircuitState = 'pending' | 'starting' | 'running' | 'ending';
type RaceOutcome = 'finished' | 'aborted';

interface Checkpoint {
  readonly position: THREE.Vector3;
  readonly rotation: number;
  readonly scale: number;
  readonly respawnPosition: THREE.Vector3;
  readonly a: THREE.Vector2;
  readonly b: THREE.Vector2;
}

interface Door {
  readonly mesh: THREE.Mesh;
  readonly scale: THREE.UniformNode<'float', number>;
}

interface Obstacle {
  readonly object: WorldObject;
  readonly basePosition: THREE.Vector3;
  readonly phase: number;
}

interface CircuitSounds {
  readonly countdown: AudioItem;
  readonly go: AudioItem;
  readonly checkpoint: AudioItem;
  readonly finish: AudioItem;
  readonly applause: AudioItem;
}

interface Podium {
  readonly object: WorldObject;
  readonly confettiPositions: readonly [THREE.Vector3, THREE.Vector3];
  readonly viewFocusPosition: THREE.Vector3;
  confettiIndex: number;
}

const CHECKPOINT = { radius: 2, respawnOffset: 3, respawnElevation: 4 } as const;
const DOOR = { size: 2, intensity: 2, speed: 0.2, targetColor: '#32ffc1', reachedColor: '#cbff62' } as const;
const COUNTDOWN_INTERVAL = 2;
const LIGHT_STEP = 0.01;
const OBSTACLE = { frequency: 1.25, amplitude: 5 } as const;
const BOUNDS_THRESHOLD = 0;
const RESPAWN_UNLOCK_DELAY = 2;
const FINISH_DELAY: Record<RaceOutcome, number> = { finished: 4, aborted: 1 };
const APPLAUSE_DELAY = 2;
const END_MODAL_DELAY = 1;
const PODIUM_FOCUS_OFFSET = new THREE.Vector3(-4, 0, -3);
const PODIUM_CONFETTI_DELAY = { min: 2, spread: 3 } as const;
const TIMER_PLAYER_OFFSET = { x: -2, z: 1 } as const;
const BANNER = { speed: 10, phase: 0.5, base: 0.5, amplitude: 0.5 } as const;
const RACE_WEATHER = { humidity: 0, electricField: 0, clouds: 0, wind: 0 } as const;
const RACE_DAY = { progress: 0.85, fogNearRatio: 0.65, fogFarRatio: 1.25 } as const;
const RESTART_ACTION = { name: 'circuitRestart', categories: ['racing'], keys: ['Keyboard.KeyR', 'Gamepad.select'] };

function requireMesh(object: THREE.Object3D): THREE.Mesh {
  if (!(object instanceof THREE.Mesh)) throw new Error(`Circuit object is not a mesh: ${object.name}`);
  return object;
}

function requireBody(object: WorldObject): RigidBody {
  const body = object.physical?.body;
  if (!body) throw new Error('Circuit object has no physical body');
  return body;
}

function createCheckpoint(reference: THREE.Object3D): Checkpoint {
  reference.rotation.reorder('YXZ');
  reference.visible = false;
  const position = reference.position.clone();
  const rotation = reference.rotation.y;
  const scale = reference.scale.x * 0.5;

  const direction = new THREE.Vector2(CHECKPOINT.respawnOffset, 0).rotateAround(new THREE.Vector2(), rotation);
  const respawnPosition = position.clone();
  respawnPosition.x += direction.y;
  respawnPosition.y = CHECKPOINT.respawnElevation;
  respawnPosition.z += direction.x;

  const center = new THREE.Vector2(position.x, position.z);
  const a = new THREE.Vector2(position.x - scale, position.z).rotateAround(center, -rotation);
  const b = new THREE.Vector2(position.x + scale, position.z).rotateAround(center, -rotation);
  return { position, rotation, scale, respawnPosition, a, b };
}

function startingLightsMesh(reference: THREE.Object3D): THREE.Mesh {
  const mesh = requireMesh(reference);
  mesh.visible = false;
  return mesh;
}

export class CircuitArea extends Area {
  #state: CircuitState = 'pending';
  readonly #sounds: CircuitSounds;
  readonly #start: { position: THREE.Vector3; rotation: number };
  readonly #lights: { mesh: THREE.Mesh; red: THREE.Material; green: THREE.Material; baseZ: number };
  readonly #timer: CircuitTimer;
  readonly #checkpoints: Checkpoint[];
  readonly #doors: { target: Door; reached: Door };
  #target: Checkpoint | null = null;
  #lastCheckpoint: Checkpoint | null = null;
  #reachedCount = 0;
  readonly #resettables: WorldObject[];
  readonly #obstacles: Obstacle[];
  readonly #roadBody: RigidBody;
  readonly #rails: WorldObject;
  readonly #startPoint: InteractivePoint;
  readonly #countdown: gsap.core.Timeline;
  #onGreenLight: (() => void) | null = null;
  #isOutOfBounds = false;
  readonly #banners: THREE.Object3D[];
  readonly #racingButtons: HTMLElement;
  readonly #endTimeElement: HTMLElement;
  readonly #podium: Podium;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#sounds = this.#registerSounds();
    const start = this.requireReference('start');
    this.#start = { position: start.position.clone(), rotation: start.rotation.y };
    const lights = startingLightsMesh(this.requireReference('startingLights'));
    const { materials } = this.game;
    this.#lights = {
      mesh: lights,
      red: materials.get('emissiveOrangeRadialGradient'),
      green: materials.get('emissiveGreenRadialGradient'),
      baseZ: lights.position.z,
    };
    this.#timer = new CircuitTimer(this.requireReference('timer'));
    this.#checkpoints = this.#references('checkpoints')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(createCheckpoint);
    this.#doors = { target: this.#createDoor(DOOR.targetColor), reached: this.#createDoor(DOOR.reachedColor) };
    this.#resettables = this.#references('objects').map(objectOf);
    this.#obstacles = this.#references('obstacles').map((reference, index) => {
      const object = objectOf(reference);
      return { object, basePosition: (object.visual?.object3D ?? reference).position.clone(), phase: -index };
    });
    this.#roadBody = requireBody(objectOf(this.requireReference('road')));
    this.#roadBody.setEnabled(false);
    this.#rails = this.#createRails();
    this.#startPoint = this.#createStartPoint();
    this.#countdown = this.#createCountdown();
    this.#listenRestartAction();
    this.#banners = this.#references('banners');
    this.#racingButtons = this.#bindMenu();
    this.#createCourseSign();
    this.#endTimeElement = this.#bindEndModal();
    this.#podium = this.#createPodium();
    this.#sharpenBrandTexture();
  }

  override setObjects(): void {
    const { materials } = this.game;
    rebuildCircuitObjects(this.model, materials);
    rebuildPodium(this.model, materials);
    reshapeCircuitDecoration(this.model, materials);
    replaceAirDancers(this.model, materials);
    super.setObjects();
  }

  get state(): CircuitState {
    return this.#state;
  }

  get isRacing(): boolean {
    return this.#state === 'running' || this.#state === 'starting';
  }

  #references(name: string): THREE.Object3D[] {
    return this.references.items.get(name) ?? [];
  }

  #registerSounds(): CircuitSounds {
    const { audio } = this.game;
    const register = (path: string, onPlay?: (item: AudioItem, reachedCount: unknown) => void): AudioItem =>
      audio.register({ path, autoplay: false, loop: false, volume: 0.5, antiSpam: 0.1, onPlay });
    return {
      countdown: register('sounds/circuit/countdown/Game Start Countdown 31-1.mp3'),
      go: register('sounds/circuit/countdown/Game Start Countdown 31-2.mp3'),
      checkpoint: register('sounds/circuit/checkpoint/Win Score 1.mp3', (item, reachedCount) => {
        if (typeof reachedCount === 'number') item.rate = 1 + (reachedCount - 1) * 0.06;
      }),
      finish: register('sounds/circuit/finish/Big Win Fanfare 2.mp3'),
      applause: register('sounds/circuit/applause/huge win.mp3'),
    };
  }

  #resetLights(): void {
    this.#lights.mesh.visible = false;
    this.#lights.mesh.material = this.#lights.red;
  }

  #createDoor(hex: string): Door {
    const scale = uniform(2);
    const doorColor = uniform(color(hex));
    const intensity = uniform(DOOR.intensity);
    const { ticker } = this.game;
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide });
    material.outputNode = Fn(() => {
      const baseUv = uv();
      const stripeUv = baseUv.toVar();
      stripeUv.y.subAssign(ticker.elapsedScaledUniform.mul(DOOR.speed));
      stripeUv.mulAssign(vec2(scale, 1).mul(2));
      const stripes = stripeUv.x.add(stripeUv.y).fract().step(0.5);
      return vec4(doorColor.mul(intensity), baseUv.y.oneMinus().mul(stripes));
    })();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.size, DOOR.size), material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.visible = false;
    this.game.scene.add(mesh);
    return { mesh, scale };
  }

  #placeDoor({ mesh, scale }: Door, checkpoint: Checkpoint): void {
    scale.value = checkpoint.scale;
    mesh.visible = true;
    mesh.position.copy(checkpoint.position);
    mesh.rotation.y = checkpoint.rotation;
    mesh.scale.x = checkpoint.scale;
  }

  #hideDoors(): void {
    this.#doors.reached.mesh.visible = false;
    this.#doors.target.mesh.visible = false;
  }

  #setTarget(checkpoint: Checkpoint): void {
    this.#target = checkpoint;
    this.#placeDoor(this.#doors.target, checkpoint);
  }

  #reach(checkpoint: Checkpoint): void {
    if (checkpoint !== this.#target) return;
    const { confetti } = this.game.world;
    confetti?.pop(new THREE.Vector3(checkpoint.a.x, 0, checkpoint.a.y));
    confetti?.pop(new THREE.Vector3(checkpoint.b.x, 0, checkpoint.b.y));
    this.#placeDoor(this.#doors.reached, checkpoint);
    this.#lastCheckpoint = checkpoint;
    this.#reachedCount += 1;
    this.#sounds.checkpoint.play(this.#reachedCount);

    const isLapComplete = this.#reachedCount === this.#checkpoints.length + 1;
    const next = this.#checkpoints[this.#reachedCount % this.#checkpoints.length];
    if (isLapComplete) this.finish();
    else if (next) this.#setTarget(next);
  }

  #resetObjects(): void {
    for (const object of this.#resettables) this.game.objects.resetObject(object);
  }

  #createRails(): WorldObject {
    const mesh = requireMesh(this.requireReference('rails'));
    if (!Array.isArray(mesh.material)) {
      mesh.material = mesh.material.clone();
      mesh.material.side = THREE.DoubleSide;
    }
    const rails = objectOf(mesh);
    this.game.objects.disable(rails);
    return rails;
  }

  #createStartPoint(): InteractivePoint {
    const { interactiveButtons } = this.game.inputs;
    return this.game.interactivePoints.create({
      position: this.requireReference('interactivePoint').position,
      text: '출발!',
      align: 'right',
      state: 'concealed',
      onInteract: () => {
        this.game.audio.groups.get('click')?.play(true);
        this.restart();
      },
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #createCountdown(): gsap.core.Timeline {
    const lights = this.#lights;
    const step = (count: number) => () => {
      this.#sounds.countdown.play();
      lights.mesh.position.z = lights.baseZ + LIGHT_STEP * count;
    };
    const timeline = gsap.timeline({ paused: true });
    timeline.add(() => {
      lights.mesh.visible = true;
      step(1)();
    });
    timeline.add(gsap.delayedCall(COUNTDOWN_INTERVAL, step(2)));
    timeline.add(gsap.delayedCall(COUNTDOWN_INTERVAL, step(3)));
    timeline.add(
      gsap.delayedCall(COUNTDOWN_INTERVAL, () => {
        this.#sounds.go.play();
        lights.mesh.material = lights.green;
        this.#onGreenLight?.();
      }),
    );
    timeline.add(gsap.delayedCall(COUNTDOWN_INTERVAL, () => {}));
    return timeline;
  }

  #startCountdown(onGreenLight: () => void): void {
    this.#onGreenLight = onGreenLight;
    this.#countdown.seek(0);
    this.#countdown.play();
  }

  #listenRestartAction(): void {
    const { inputs } = this.game;
    inputs.addActions([RESTART_ACTION]);
    inputs.events.on(RESTART_ACTION.name, (action: Action) => {
      if (action.active) this.restart();
    });
  }

  respawn(): void {
    if (this.#state !== 'running') return;
    const { player, overlay, physicalVehicle } = this.game;
    player.state = Player.STATE_LOCKED;
    const last = this.#lastCheckpoint;
    const position = last ? last.respawnPosition.clone() : this.#start.position.clone();
    const rotation = last ? last.rotation + Math.PI * 0.5 : this.#start.rotation;
    overlay.show(() => {
      gsap.delayedCall(RESPAWN_UNLOCK_DELAY, () => {
        player.state = Player.STATE_DEFAULT;
      });
      physicalVehicle.moveTo(position, rotation);
      overlay.hide();
    });
  }

  #createPodium(): Podium {
    const respawn = this.game.respawns.getByName('circuit');
    const viewFocusPosition = respawn.position.clone().add(PODIUM_FOCUS_OFFSET);
    viewFocusPosition.y = 0;
    const podium: Podium = {
      object: objectOf(this.requireReference('podium')),
      confettiPositions: [
        this.requireReference('podiumConfettiA').position.clone(),
        this.requireReference('podiumConfettiB').position.clone(),
      ],
      viewFocusPosition,
      confettiIndex: 0,
    };
    this.game.objects.disable(podium.object);
    return podium;
  }

  #popPodiumConfetti(): void {
    const { world, view } = this.game;
    if (!world.confetti) return;
    const podium = this.#podium;
    const position = podium.confettiPositions[podium.confettiIndex % 2];
    if (position) world.confetti.pop(position);
    podium.confettiIndex += 1;
    if (view.focusPoint.isTracking) return;
    gsap.delayedCall(PODIUM_CONFETTI_DELAY.min + Math.random() * PODIUM_CONFETTI_DELAY.spread, () =>
      this.#popPodiumConfetti(),
    );
  }

  #showPodium(): void {
    const { objects, view } = this.game;
    objects.enable(this.#podium.object);
    view.focusPoint.isTracking = false;
    view.focusPoint.position.copy(this.#podium.viewFocusPosition);
    this.#popPodiumConfetti();
  }

  #bindMenu(): HTMLElement {
    const { menu } = this.game;
    const item = menu.items.get('circuit');
    if (!item) throw new Error('Circuit menu is missing');
    const element = item.contentElement;
    requireElement(element, '.js-button-restart', HTMLElement).addEventListener('click', () => {
      this.restart();
      menu.close();
    });
    requireElement(element, '.js-button-end', HTMLElement).addEventListener('click', () => {
      if (this.isRacing) this.#endRace('aborted');
      menu.close();
    });
    requireElement(element, '.js-button-controls', HTMLElement).addEventListener('click', () => menu.open('controls'));
    return requireElement(element, '.js-racing-buttons', HTMLElement);
  }

  #createCourseSign(): void {
    const reset = this.requireReference('leaderboardReset');
    paintCourseSign(this.requireReference('leaderboard'), this.objects.items);
    paintObstacleResetSign(reset);
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: reset.position.clone().add(new THREE.Vector3(0, 1, 0)),
      text: '장애물 다시 놓기',
      align: 'right',
      state: 'concealed',
      onInteract: () => this.#resetObjects(),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #bindEndModal(): HTMLElement {
    const { modals } = this.game;
    const modal = modals.items.get('circuit-end');
    if (!modal) throw new Error('Circuit end modal is missing');
    requireElement(modal.element, '.js-button-restart', HTMLElement).addEventListener('click', () => {
      this.restart();
      modals.close();
    });
    return requireElement(modal.element, '.js-time', HTMLElement);
  }

  #sharpenBrandTexture(): void {
    const map: unknown = Reflect.get(this.game.materials.get('circuitBrand'), 'map');
    if (!(map instanceof THREE.Texture)) return;
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
  }

  #endTimer(): void {
    this.#endTimeElement.textContent = this.#timer.end();
  }

  restart(): void {
    if (this.#state === 'starting') return;
    if (this.frustum) this.frustum.alwaysVisible = true;
    this.#endTimer();
    this.#state = 'starting';
    this.#startPoint.hide();

    const { player, inputs, overlay } = this.game;
    player.state = Player.STATE_LOCKED;
    inputs.filters.clear();
    inputs.filters.add('racing');
    this.#countdown.pause();
    overlay.show(() => {
      this.#prepareRace();
      overlay.hide(() => {
        this.#state = 'running';
        this.#startCountdown(() => {
          player.state = Player.STATE_DEFAULT;
          this.#timer.start();
        });
      });
    });
  }

  #prepareRace(): void {
    const { physicalVehicle, world, weather, dayCycles } = this.game;
    this.#racingButtons.classList.add('is-active');
    physicalVehicle.moveTo(this.#start.position, this.#start.rotation);
    world.floor?.physical.body.setEnabled(false);
    this.#roadBody.setEnabled(true);
    this.#resetLights();
    this.#hideDoors();
    const first = this.#checkpoints[0];
    if (first) this.#setTarget(first);
    this.#reachedCount = 0;
    this.#lastCheckpoint = null;
    this.#resetObjects();
    world.explosiveCrates?.reset();
    weather.override.start(RACE_WEATHER, 0);
    dayCycles.override.start(RACE_DAY, 0);
    this.#timer.show();
    this.game.objects.enable(this.#rails);
    this.game.objects.disable(this.#podium.object);
  }

  finish(): void {
    this.#endRace('finished');
  }

  #endRace(outcome: RaceOutcome): void {
    if (this.#state !== 'running') return;
    this.#state = 'ending';
    this.#endTimer();
    if (outcome === 'aborted') this.#timer.hide();
    this.#target = null;
    this.#doors.target.mesh.visible = false;
    if (outcome === 'finished') this.#sounds.finish.play();

    const { overlay } = this.game;
    gsap.delayedCall(FINISH_DELAY[outcome], () => {
      overlay.show(() => {
        this.#returnToIsland(outcome);
        overlay.hide(() => {
          this.#state = 'pending';
        });
      });
    });
  }

  #returnToIsland(outcome: RaceOutcome): void {
    const { inputs, respawns, physicalVehicle, world, weather, dayCycles, objects, modals } = this.game;
    this.#state = 'pending';
    if (this.frustum) this.frustum.alwaysVisible = false;
    this.#racingButtons.classList.remove('is-active');
    this.#startPoint.show();
    inputs.filters.clear();
    inputs.filters.add('wandering');
    const respawn = respawns.getByName('circuit');
    physicalVehicle.moveTo(respawn.position, respawn.rotation);
    world.floor?.physical.body.setEnabled(true);
    this.#roadBody.setEnabled(false);
    weather.override.end(0);
    dayCycles.override.end(0);
    this.#hideDoors();
    this.#resetLights();
    objects.disable(this.#rails);
    world.explosiveCrates?.reset();
    if (outcome !== 'finished') return;
    this.#showPodium();
    gsap.delayedCall(APPLAUSE_DELAY, () => this.#sounds.applause.play());
    gsap.delayedCall(END_MODAL_DELAY, () => modals.open('circuit-end'));
  }

  #updateRace(): void {
    const { player } = this.game;
    const sensor = { center: player.position2, radius: CHECKPOINT.radius };
    for (const checkpoint of this.#checkpoints) {
      if (segmentCircleIntersection(checkpoint.a, checkpoint.b, sensor).length) this.#reach(checkpoint);
    }

    for (const { object, basePosition, phase } of this.#obstacles) {
      const position = basePosition.clone();
      position.z += Math.sin(this.#timer.elapsedTime * OBSTACLE.frequency + phase) * OBSTACLE.amplitude;
      object.physical?.body.setNextKinematicTranslation(position);
      object.needsUpdate = true;
    }

    const isOut = player.position.y < BOUNDS_THRESHOLD;
    if (isOut && !this.#isOutOfBounds) this.respawn();
    this.#isOutOfBounds = isOut;
  }

  #waveBanners(): void {
    const localTime = this.game.wind.localTime.value;
    for (const [index, banner] of this.#banners.entries()) {
      const time = localTime * BANNER.speed + index * BANNER.phase;
      const sway = Math.sin(time) + Math.sin(time * 2.34) * 0.5 + Math.sin(time * 3.45) * 0.25;
      banner.rotation.y = BANNER.base + sway * BANNER.amplitude;
    }
  }

  #timerTarget(): THREE.Vector3 {
    if (this.#state === 'pending') return this.#timer.homePosition;
    const { position } = this.game.player;
    return new THREE.Vector3(position.x + TIMER_PLAYER_OFFSET.x, 0, position.z + TIMER_PLAYER_OFFSET.z);
  }

  override update(): void {
    if (this.#state === 'running') this.#updateRace();
    this.#waveBanners();
    this.#timer.update(this.#timerTarget());
  }
}
