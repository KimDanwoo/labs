import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import type { InteractivePoint } from '../../interactivePoint';
import { objectOf, type WorldObject } from '../../objectColliders';
import { Player } from '../../player';
import { Area } from './area';
import { CircuitCheckpoints } from './circuitCheckpoints';
import {
  APPLAUSE_DELAY,
  BOUNDS_THRESHOLD,
  type CircuitSounds,
  type CircuitState,
  END_MODAL_DELAY,
  FINISH_DELAY,
  type Obstacle,
  type RaceOutcome,
  RESPAWN_UNLOCK_DELAY,
} from './circuitConfig';
import { CircuitLights } from './circuitLights';
import { createRaceWorld, enterRaceWorld, leaveRaceWorld, type RaceWorld, respawnPose } from './circuitRaceWorld';
import {
  createObstacles,
  createStartPoint,
  listenRestartAction,
  rebuildCircuitModel,
  registerCircuitSounds,
  showPodium,
  swayObstacles,
  timerTarget,
  waveBanners,
} from './circuitSetup';
import { CircuitTimer } from './circuitTimer';
import { bindEndModal, createCourseSign, sharpenBrandTexture } from './circuitUi';

export class CircuitArea extends Area {
  #state: CircuitState = 'pending';
  readonly #sounds: CircuitSounds;
  readonly #lights: CircuitLights;
  readonly #timer: CircuitTimer;
  readonly #course: CircuitCheckpoints;
  readonly #resettables: WorldObject[];
  readonly #obstacles: Obstacle[];
  readonly #race: RaceWorld;
  readonly #startPoint: InteractivePoint;
  #isOutOfBounds = false;
  readonly #banners: THREE.Object3D[];
  readonly #endTimeElement: HTMLElement;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#sounds = registerCircuitSounds(this);
    this.#lights = new CircuitLights(this.game, this.requireReference('startingLights'), this.#sounds);
    this.#timer = new CircuitTimer(this.requireReference('timer'));
    this.#course = new CircuitCheckpoints(this, this.#references('checkpoints'), this.#sounds);
    this.#resettables = this.#references('objects').map(objectOf);
    this.#obstacles = createObstacles(this.#references('obstacles'));
    this.#startPoint = createStartPoint(this, () => this.restart());
    listenRestartAction(this.game, () => this.restart());
    this.#banners = this.#references('banners');
    this.#race = createRaceWorld(this, {
      isRacing: () => this.isRacing,
      onRestart: () => this.restart(),
      onAbort: () => this.#endRace('aborted'),
    });
    createCourseSign(this, this.#course.count, () => this.#resetObjects());
    this.#endTimeElement = bindEndModal(this, () => this.restart());
    sharpenBrandTexture(this);
  }

  override setObjects(): void {
    rebuildCircuitModel(this.model);
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

  #resetObjects(): void {
    for (const object of this.#resettables) this.game.objects.resetObject(object);
  }

  respawn(): void {
    if (this.#state !== 'running') return;
    const { player, overlay, physicalVehicle } = this.game;
    player.state = Player.STATE_LOCKED;
    const { position, rotation } = respawnPose(this.#course.last, this.#race.start);
    overlay.show(() => {
      gsap.delayedCall(RESPAWN_UNLOCK_DELAY, () => {
        player.state = Player.STATE_DEFAULT;
      });
      physicalVehicle.moveTo(position, rotation);
      overlay.hide();
    });
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
    this.#lights.pause();
    overlay.show(() => {
      this.#prepareRace();
      overlay.hide(() => {
        this.#state = 'running';
        this.#lights.start(() => {
          player.state = Player.STATE_DEFAULT;
          this.#timer.start();
        });
      });
    });
  }

  #prepareRace(): void {
    this.#lights.reset();
    this.#course.reset();
    this.#resetObjects();
    enterRaceWorld(this.game, this.#race);
    this.#timer.show();
  }

  finish(): void {
    this.#endRace('finished');
  }

  #endRace(outcome: RaceOutcome): void {
    if (this.#state !== 'running') return;
    this.#state = 'ending';
    this.#endTimer();
    if (outcome === 'aborted') this.#timer.hide();
    this.#course.clearTarget();
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
    this.#state = 'pending';
    if (this.frustum) this.frustum.alwaysVisible = false;
    this.#startPoint.show();
    leaveRaceWorld(this.game, this.#race);
    this.#course.hideDoors();
    this.#lights.reset();
    if (outcome !== 'finished') return;
    showPodium(this.game, this.#race.podium);
    gsap.delayedCall(APPLAUSE_DELAY, () => this.#sounds.applause.play());
    gsap.delayedCall(END_MODAL_DELAY, () => this.game.modals.open('circuit-end'));
  }

  #updateRace(): void {
    const { player } = this.game;
    this.#course.detect(player.position2, () => this.finish());
    swayObstacles(this.#obstacles, this.#timer.elapsedTime);

    const isOut = player.position.y < BOUNDS_THRESHOLD;
    if (isOut && !this.#isOutOfBounds) this.respawn();
    this.#isOutOfBounds = isOut;
  }

  override update(): void {
    if (this.#state === 'running') this.#updateRace();
    waveBanners(this.#banners, this.game.wind.localTime.value);
    this.#timer.update(timerTarget(this.#state, this.#timer.homePosition, this.game.player.position));
  }
}
