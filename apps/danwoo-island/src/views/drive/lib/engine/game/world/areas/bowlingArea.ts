import type { RigidBody } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { type AudioItem } from '../../audioItem';
import { InstancedGroup } from '../../instancedGroup';
import type { InteractivePoint } from '../../interactivePoint';
import { JukeboxStation } from '../../jukebox/jukeboxStation';
import { clamp } from '../../utilities/maths';
import { rebuildTikiScoreboard } from '../islandReskins';
import { rebuildBowlingSign, rebuildJukebox } from '../islandStructures';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';
import {
  type Ball,
  BOUNDING_INTERVAL,
  type Pin,
  PIN_DOWN_UP_Y,
  PIN_DOWN_VALUE,
  resetBody,
  type Screen,
  SCREEN,
  SLEEP_DELAY_FRAMES,
  STRIKE_BLINK,
  STRIKE_CONFETTI_OFFSETS,
} from './bowlingConfig';
import { createBumpers, createScreen } from './bowlingLane';
import { createBall, createPins, createRestartPoint, registerBowlingSounds } from './bowlingSetup';

export class BowlingArea extends Area {
  readonly #sounds: { strike: AudioItem; pin: AudioItem };
  readonly #pins: Pin[];
  readonly #pinGroup: InstancedGroup;
  readonly #ball: Ball;
  readonly #screen: Screen;
  readonly #screenTarget = new THREE.Vector3();
  readonly #restartPoint: InteractivePoint;
  readonly jukebox: JukeboxStation;
  #isWon = false;
  #wonTime = 0;
  #pinsAllSleeping = true;
  #boundingUpdateTime = 0;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#sounds = registerBowlingSounds(this, () => this.#ball);
    const { pins, group } = createPins(this, this.#sounds.pin);
    this.#pins = pins;
    this.#pinGroup = group;
    this.#ball = createBall(this);
    this.#restartPoint = createRestartPoint(this, () => this.restart());
    this.#screen = createScreen(this);
    createBumpers(this);
    this.jukebox = new JukeboxStation({
      anchor: this.requireReference('jukebox'),
      pointPosition: this.requireReference('jukeboxInteractivePoint').position,
    });
  }

  override setObjects(): void {
    rebuildVillageProps(this.model);
    rebuildBowlingSign(this.model, this.game.texture('bowlingNeonTexture'));
    rebuildJukebox(this.model);
    rebuildTikiScoreboard(this.model);
    super.setObjects();
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

  #updateScreen(): void {
    const { player, ticker } = this.game;
    const screen = this.#screen;
    const along = this.#screenTarget.copy(player.position).sub(screen.home).dot(screen.lane);
    const target = clamp(along, -SCREEN.travel, 0);
    screen.travel += (target - screen.travel) * ticker.deltaScaled * SCREEN.easing;
    screen.object.physical?.body.setNextKinematicTranslation(
      this.#screenTarget.copy(screen.home).addScaledVector(screen.lane, screen.travel),
    );
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
    for (const offset of STRIKE_CONFETTI_OFFSETS) {
      confetti.pop(this.#screen.group.position.clone().add(offset.clone().applyQuaternion(this.model.quaternion)));
    }
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
