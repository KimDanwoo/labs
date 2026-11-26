import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { INPUT_MODE } from '@views/drive/lib/engine/game/inputs/inputTypes';
import type { SuspensionState } from '@views/drive/lib/engine/game/physics/vehicleConfig';
import {
  ACTIONS,
  DIE_RESPAWN_DELAY,
  FLY_BUTTON,
  FLY_CATEGORY,
  HONK_DURATION,
  NIPPLE_JUMP_DURATION,
  numberOrZero,
  SUSPENSION_ACTIONS,
  UNSTUCK_DELAY,
  WHEEL_COUNT,
  WHEEL_SUSPENSION_ACTIONS,
  type PlayerSounds,
} from '@views/drive/lib/engine/game/playerConfig';
import { readNipple, syncAfterPhysics } from '@views/drive/lib/engine/game/playerControls';
import { registerDrivingSounds, registerPlayerSounds } from '@views/drive/lib/engine/game/playerSounds';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

export class Player {
  static readonly STATE_DEFAULT = 1;
  static readonly STATE_LOCKED = 2;

  state: number = Player.STATE_DEFAULT;
  accelerating = 0;
  steering = 0;
  boosting = 0;
  braking = 0;
  readonly suspensions: SuspensionState[] = Array.from({ length: WHEEL_COUNT }, (): SuspensionState => 'low');
  readonly position: THREE.Vector3;
  readonly basePosition: THREE.Vector3;
  readonly position2: THREE.Vector2;
  rotationY = 0;
  readonly sounds: PlayerSounds;
  #unstuckDelay: gsap.core.Tween | null = null;
  #respawnSequence = 0;
  #nippleJumpTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const game = getGame();
    const respawn = game.respawns.getDefault();
    this.position = respawn.position.clone();
    this.basePosition = this.position.clone();
    this.position2 = new THREE.Vector2(this.position.x, this.position.z);

    this.sounds = registerPlayerSounds();
    registerDrivingSounds(this);
    this.#bindInputs();
    this.#bindUnstuck();

    const { initialState } = game.physicalVehicle.chassis.physical;
    initialState.position.x = respawn.position.x;
    initialState.position.y = respawn.position.y;
    initialState.position.z = respawn.position.z;
    game.physicalVehicle.moveTo(respawn.position, respawn.rotation);

    game.ticker.events.on('tick', () => this.#updatePrePhysics(), TICK_ORDER.playerPrePhysics);
    game.ticker.events.on('tick', () => syncAfterPhysics(this), TICK_ORDER.playerPostPhysics);
  }

  #bindInputs(): void {
    const { inputs } = getGame();
    inputs.addActions(ACTIONS);

    inputs.events.on('respawn', (action) => {
      const shouldRespawn = this.state === Player.STATE_DEFAULT && action.active;
      if (shouldRespawn) this.respawn();
    });
    inputs.events.on('honk', (action) => {
      if (action.active) this.honk();
    });
    for (const name of SUSPENSION_ACTIONS) inputs.events.on(name, () => this.#updateSuspensions());
    inputs.events.on('suspensions', () => {
      if (inputs.mode === INPUT_MODE.touch) inputs.nipple.jump();
    });
    inputs.nipple.events.on('tap', () => this.#nippleJump());
    inputs.events.on('fly', (action) => {
      if (action.active) this.#toggleFlight();
    });
    inputs.interactiveButtons.events.on(FLY_BUTTON, () => this.#toggleFlight());
  }

  #toggleFlight(): void {
    if (this.state !== Player.STATE_DEFAULT) return;
    getGame().physicalVehicle.flight.toggle();
  }

  #syncFlyButton(): void {
    const { inputs } = getGame();
    const buttons = inputs.interactiveButtons;
    const shouldShow = inputs.filters.has(FLY_CATEGORY);
    if (shouldShow === buttons.has(FLY_BUTTON)) return;
    if (shouldShow) buttons.addItems([FLY_BUTTON]);
    else buttons.removeItems([FLY_BUTTON]);
  }

  #isActive(name: string): boolean {
    return getGame().inputs.actions.get(name)?.active ?? false;
  }

  #updateSuspensions(): void {
    if (this.state !== Player.STATE_DEFAULT) return;
    const isFlying = getGame().physicalVehicle.flight.isActive;
    if (isFlying) {
      this.suspensions.fill('low');
      return;
    }
    const activeState: SuspensionState = this.#isActive('suspensions') ? 'high' : 'mid';
    const raisedWheels = WHEEL_SUSPENSION_ACTIONS.map((names) => names.some((name) => this.#isActive(name)));
    for (const [index, isRaised] of raisedWheels.entries()) this.suspensions[index] = isRaised ? activeState : 'low';

    const raisedCount = raisedWheels.filter(Boolean).length;
    if (raisedCount > 0) this.sounds.suspensions.play(raisedCount);
  }

  #nippleJump(): void {
    getGame().inputs.nipple.jump();
    this.suspensions.fill('high');
    if (this.#nippleJumpTimeout) clearTimeout(this.#nippleJumpTimeout);
    this.#nippleJumpTimeout = setTimeout(() => this.suspensions.fill('low'), NIPPLE_JUMP_DURATION);
  }

  #bindUnstuck(): void {
    const { physicalVehicle, inputs } = getGame();
    physicalVehicle.events.on('rightSideUp', () => this.#unstuckDelay?.kill());
    physicalVehicle.events.on('upsideDown', () => {
      this.#unstuckDelay?.kill();
      this.#scheduleFlipCheck();
    });
    physicalVehicle.events.on('stuck', () => inputs.interactiveButtons.addItems(['unstuck']));
    physicalVehicle.events.on('unstuck', () => inputs.interactiveButtons.removeItems(['unstuck']));
    inputs.interactiveButtons.events.on('unstuck', () => {
      inputs.interactiveButtons.removeItems(['unstuck']);
      this.respawn();
    });
  }

  #scheduleFlipCheck(): void {
    this.#unstuckDelay = gsap.delayedCall(UNSTUCK_DELAY, () => {
      this.#unstuckDelay = null;
      const { physicalVehicle } = getGame();
      if (this.state !== Player.STATE_DEFAULT) return;
      if (!physicalVehicle.upsideDown.active) return;
      physicalVehicle.flip.jump();
      this.sounds.suspensions.play(WHEEL_COUNT);
      this.#scheduleFlipCheck();
    });
  }

  get respawnSequence(): number {
    return this.#respawnSequence;
  }

  respawn(respawnName?: string | null, callback?: () => void): void {
    const game = getGame();
    this.#respawnSequence += 1;
    game.overlay.show(() => {
      callback?.();
      const respawn = respawnName
        ? game.respawns.getByName(respawnName)
        : game.respawns.getClosest(this.position, { isLighthouseAccessible: game.water.isLighthouseAccessible });
      game.physicalVehicle.moveTo(respawn.position, respawn.rotation);
      this.state = Player.STATE_DEFAULT;
      game.overlay.hide();
    });
  }

  die(): void {
    this.state = Player.STATE_LOCKED;
    gsap.delayedCall(DIE_RESPAWN_DELAY, () => {
      this.respawn(null, () => {
        this.state = Player.STATE_DEFAULT;
      });
    });
  }

  honk(): void {
    const wheelIndex = Math.floor(Math.random() * WHEEL_COUNT);
    const previousState = this.suspensions[wheelIndex] ?? 'low';
    this.suspensions[wheelIndex] = 'mid';
    gsap.delayedCall(HONK_DURATION, () => {
      if (this.suspensions[wheelIndex] === 'mid') this.suspensions[wheelIndex] = previousState;
    });
  }

  #updatePrePhysics(): void {
    this.accelerating = 0;
    this.steering = 0;
    this.boosting = 0;
    this.braking = 0;
    this.#syncFlyButton();
    if (this.state !== Player.STATE_DEFAULT) return;

    this.#readThrottleInputs();
    this.#readSteeringInputs();
    const nipple = readNipple();
    if (nipple) ({ accelerating: this.accelerating, steering: this.steering } = nipple);
  }

  #readThrottleInputs(): void {
    const { inputs } = getGame();
    const forward = inputs.actions.get('forward');
    const backward = inputs.actions.get('backward');
    if (forward?.active) this.accelerating += numberOrZero(forward.value);
    if (backward?.active) this.accelerating -= numberOrZero(backward.value);
    if (this.#isActive('boost')) this.boosting = 1;
    if (!this.#isActive('brake')) return;
    this.braking = 1;
    const isFlying = getGame().physicalVehicle.flight.isActive;
    if (!isFlying) this.accelerating = 0;
  }

  #readSteeringInputs(): void {
    if (this.#isActive('right')) this.steering -= 1;
    if (this.#isActive('left')) this.steering += 1;

    const leftStick = getGame().inputs.gamepad.joysticks.left;
    const shouldUseStick = this.steering === 0 && leftStick.active;
    if (shouldUseStick) this.steering = -leftStick.safeX;
  }
}
