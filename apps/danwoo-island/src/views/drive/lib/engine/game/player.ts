import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import type { AudioItem } from './audioItem';
import { getGame } from './gameContext';
import { INPUT_MODE } from './inputs/inputs';
import type { SuspensionState } from './physics/physicsVehicle';
import { TICK_ORDER } from './tickOrder';
import { clamp, remapClamp } from './utilities/maths';

const WHEEL_COUNT = 4;
const UNSTUCK_DELAY = 3;
const DIE_RESPAWN_DELAY = 2;
const HONK_DURATION = 0.15;
const NIPPLE_JUMP_DURATION = 200;
const NIPPLE_TRACKING_DELAY_FRAMES = 5;
const NIPPLE_ACCELERATION_POWER = 3;
const SPEED_LINES_SPEED = 15;
const LANDING_SOUND_WHEELS = 1;
const WHEELS_ON_FLOOR_ELEVATION = 1.08;
const DRIVE_CATEGORIES = ['wandering', 'racing', 'cinematic'];
const RACE_CATEGORIES = ['wandering', 'racing'];

const SUSPENSION_ACTIONS = [
  'suspensions',
  'suspensionsFront',
  'suspensionsBack',
  'suspensionsRight',
  'suspensionsLeft',
  'suspensionsFrontLeft',
  'suspensionsFrontRight',
  'suspensionsBackRight',
  'suspensionsBackLeft',
] as const;
type SuspensionAction = (typeof SUSPENSION_ACTIONS)[number];

const WHEEL_SUSPENSION_ACTIONS: readonly (readonly SuspensionAction[])[] = [
  ['suspensions', 'suspensionsFront', 'suspensionsRight', 'suspensionsFrontRight'],
  ['suspensions', 'suspensionsFront', 'suspensionsLeft', 'suspensionsFrontLeft'],
  ['suspensions', 'suspensionsBack', 'suspensionsRight', 'suspensionsBackRight'],
  ['suspensions', 'suspensionsBack', 'suspensionsLeft', 'suspensionsBackLeft'],
];

const ACTIONS = [
  {
    name: 'forward',
    categories: DRIVE_CATEGORIES,
    keys: ['Keyboard.ArrowUp', 'Keyboard.KeyW', 'Gamepad.up', 'Gamepad.r2'],
  },
  { name: 'right', categories: DRIVE_CATEGORIES, keys: ['Keyboard.ArrowRight', 'Keyboard.KeyD', 'Gamepad.right'] },
  {
    name: 'backward',
    categories: DRIVE_CATEGORIES,
    keys: ['Keyboard.ArrowDown', 'Keyboard.KeyS', 'Gamepad.down', 'Gamepad.l2'],
  },
  { name: 'left', categories: DRIVE_CATEGORIES, keys: ['Keyboard.ArrowLeft', 'Keyboard.KeyA', 'Gamepad.left'] },
  { name: 'boost', categories: RACE_CATEGORIES, keys: ['Keyboard.ShiftLeft', 'Keyboard.ShiftRight', 'Gamepad.circle'] },
  { name: 'brake', categories: RACE_CATEGORIES, keys: ['Keyboard.KeyB', 'Keyboard.ControlLeft', 'Gamepad.square'] },
  { name: 'respawn', categories: ['wandering'], keys: ['Keyboard.KeyR', 'Gamepad.select'] },
  {
    name: 'suspensions',
    categories: RACE_CATEGORIES,
    keys: ['Keyboard.Numpad5', 'Keyboard.Space', 'Gamepad.triangle'],
  },
  { name: 'suspensionsFront', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad8'] },
  { name: 'suspensionsBack', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad2'] },
  { name: 'suspensionsRight', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad6', 'Gamepad.r1'] },
  { name: 'suspensionsLeft', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad4', 'Gamepad.l1'] },
  { name: 'suspensionsFrontLeft', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad7', 'Keyboard.Digit2'] },
  { name: 'suspensionsFrontRight', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad9', 'Keyboard.Digit3'] },
  { name: 'suspensionsBackRight', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad3', 'Keyboard.Digit4'] },
  { name: 'suspensionsBackLeft', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad1', 'Keyboard.Digit1'] },
  {
    name: 'interact',
    categories: DRIVE_CATEGORIES,
    keys: ['Keyboard.Enter', 'Keyboard.KeyE', 'Keyboard.KeyF', 'Gamepad.cross'],
  },
  { name: 'honk', categories: DRIVE_CATEGORIES, keys: ['Keyboard.KeyH', 'Gamepad.l3'] },
];

interface PlayerSounds {
  suspensions: AudioItem;
  honk: AudioItem;
  spring1: AudioItem;
  spring2: AudioItem;
}

function easeToward(item: AudioItem, volume: number, easing: { rising: number; falling: number }): void {
  const delta = volume - item.volume;
  item.volume += delta * getGame().ticker.deltaScaled * (delta > 0 ? easing.rising : easing.falling);
}

function easeRate(item: AudioItem, rate: number): void {
  item.rate += (rate - item.rate) * getGame().ticker.deltaScaled * 5;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

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

    this.sounds = this.#registerSounds();
    this.#registerDrivingSounds();
    this.#bindInputs();
    this.#bindUnstuck();

    const { initialState } = game.physicalVehicle.chassis.physical;
    initialState.position.x = respawn.position.x;
    initialState.position.y = respawn.position.y;
    initialState.position.z = respawn.position.z;
    game.physicalVehicle.moveTo(respawn.position, respawn.rotation);

    game.ticker.events.on('tick', () => this.#updatePrePhysics(), TICK_ORDER.playerPrePhysics);
    game.ticker.events.on('tick', () => this.#updatePostPhysics(), TICK_ORDER.playerPostPhysics);
  }

  #registerSounds(): PlayerSounds {
    const { audio, inputs } = getGame();
    return {
      suspensions: audio.register({
        path: 'sounds/vehicle/suspensions/Robotic_Lifeforms_2_-_Air_Source_-_Piston_Studio_Chair_07.mp3',
        autoplay: false,
        loop: false,
        volume: 0.4,
        antiSpam: 0.1,
        onPlay: (item, count) => {
          item.volume = 0.3 + numberOrZero(count) * 0.08;
          item.rate = 0.9 + Math.random() * 0.2;
        },
      }),
      honk: audio.register({
        path: 'sounds/vehicle/honk/Car Horn Long 4.mp3',
        autoplay: true,
        loop: true,
        volume: 0.4,
        antiSpam: 0.1,
        onPlaying: (item) => {
          item.volume = inputs.actions.get('honk')?.active ? 0.5 : 0;
        },
      }),
      spring1: audio.register({
        path: 'sounds/vehicle/springs/HandleSqueak_BW.60329.mp3',
        autoplay: false,
        loop: false,
        volume: 0.4,
        antiSpam: 1,
        onPlay: (item, count) => {
          item.volume = 0.05 + numberOrZero(count) * 0.02;
          item.rate = 1 + Math.random() * 0.1;
        },
      }),
      spring2: audio.register({
        path: 'sounds/vehicle/springs/SpringMetalMovements_1u54Y_01.mp3',
        autoplay: false,
        loop: false,
        volume: 0.4,
        antiSpam: 0.2,
        onPlay: (item, count) => {
          item.volume = 0.05 + numberOrZero(count) * 0.1;
          item.rate = 0.9 + Math.random() * 0.4;
        },
      }),
    };
  }

  #registerDrivingSounds(): void {
    const { audio, physicalVehicle: vehicle, ticker } = getGame();
    audio.register({
      group: 'wheelsOnFloor',
      path: 'sounds/vehicle/floor/wheels-on-pebbles-road.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        const inAirEffect = remapClamp(Math.abs(vehicle.position.y - WHEELS_ON_FLOOR_ELEVATION), [0, 2], [1, 0]);
        const speedEffect = Math.min(1, vehicle.xzSpeed * 0.1);
        item.volume = inAirEffect * speedEffect * 0.25;
      },
    });
    audio.register({
      group: 'wheelsOnFloor',
      path: 'sounds/vehicle/floor/Source Stone Loop Small Rubbing Pebbles On Concrete 02.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        const directionRatio = (1 - Math.abs(vehicle.forwardRatio)) * 0.6;
        const brakeEffect = clamp(
          (Math.max(directionRatio, this.braking) * vehicle.xzSpeed * 0.15 * vehicle.wheels.inContactCount) /
            WHEEL_COUNT,
          0,
          1,
        );
        const delta = brakeEffect * 0.4 - item.volume;
        item.volume += delta * ticker.deltaScaled * (delta > 0 ? 20 : 5);
        item.rate = 0.8;
      },
    });
    audio.register({
      path: 'sounds/vehicle/engine/muscle car engine loop idle.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        const accelerating = Math.abs(this.accelerating) * 0.5;
        const boosting = this.boosting + 1;
        easeToward(item, Math.max(0.05, accelerating * boosting * 0.8), { rising: 10, falling: 2.5 });
        easeRate(item, remapClamp(accelerating * boosting, [0, 1], [0.6, 1.1]));
      },
    });
    audio.register({
      path: 'sounds/vehicle/spin/41051 Glass stone turning loop 09-full.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        const speedEffect = clamp(vehicle.xzSpeed * 0.1, 0, 1);
        easeToward(item, speedEffect * 0.3, { rising: 10, falling: 2.5 });
        easeRate(item, remapClamp(speedEffect, [0, 1], [1, 2]));
      },
    });
    audio.register({
      path: 'sounds/vehicle/energy/Energy_-_force_field_8_loop.mp3',
      autoplay: true,
      loop: true,
      volume: 0,
      onPlaying: (item) => {
        const accelerating = 0.5 + Math.abs(this.accelerating) * 0.5;
        easeToward(item, accelerating * this.boosting * 0.3, { rising: 10, falling: 1 });
        easeRate(item, 0.95 + Math.abs(this.accelerating) * 2);
      },
    });
  }

  #bindInputs(): void {
    const { inputs } = getGame();
    inputs.addActions(ACTIONS);

    inputs.events.on('respawn', (action) => {
      if (this.state === Player.STATE_DEFAULT && action.active) this.respawn();
    });
    inputs.events.on('honk', (action) => {
      if (action.active) this.honk();
    });
    for (const name of SUSPENSION_ACTIONS) inputs.events.on(name, () => this.#updateSuspensions());
    inputs.events.on('suspensions', () => {
      if (inputs.mode === INPUT_MODE.touch) inputs.nipple.jump();
    });
    inputs.nipple.events.on('tap', () => this.#nippleJump());
  }

  #isActive(name: string): boolean {
    return getGame().inputs.actions.get(name)?.active ?? false;
  }

  #updateSuspensions(): void {
    if (this.state !== Player.STATE_DEFAULT) return;
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
      if (this.state !== Player.STATE_DEFAULT || !physicalVehicle.upsideDown.active) return;
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
      const respawn = respawnName ? game.respawns.getByName(respawnName) : game.respawns.getClosest(this.position);
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
    if (this.state !== Player.STATE_DEFAULT) return;

    const { inputs } = getGame();
    const forward = inputs.actions.get('forward');
    const backward = inputs.actions.get('backward');
    if (forward?.active) this.accelerating += numberOrZero(forward.value);
    if (backward?.active) this.accelerating -= numberOrZero(backward.value);
    if (this.#isActive('boost')) this.boosting = 1;
    if (this.#isActive('brake')) {
      this.accelerating = 0;
      this.braking = 1;
    }
    if (this.#isActive('right')) this.steering -= 1;
    if (this.#isActive('left')) this.steering += 1;

    const leftStick = inputs.gamepad.joysticks.left;
    if (this.steering === 0 && leftStick.active) this.steering = -leftStick.safeX;
    this.#applyNipple();
  }

  #applyNipple(): void {
    const { inputs, view, ticker } = getGame();
    const { nipple } = inputs;
    if (!nipple.active || nipple.progress <= 0) return;

    if (!view.focusPoint.isTracking) {
      ticker.wait(NIPPLE_TRACKING_DELAY_FRAMES, () => {
        if (nipple.active) view.focusPoint.isTracking = true;
      });
    }
    this.accelerating = nipple.progress ** NIPPLE_ACCELERATION_POWER;

    const halfReverseArc = (Math.PI * 2 - nipple.forwardAmplitude) / 2;
    const normalizedAngle = Math.abs(nipple.smallestAngle) / halfReverseArc;
    this.steering = -Math.min(normalizedAngle, 1) * Math.sign(nipple.smallestAngle);
    if (!nipple.forward) {
      this.accelerating *= -1;
      this.steering *= -1;
    }
  }

  #updatePostPhysics(): void {
    const { physicalVehicle: vehicle, view, tracks, inputs } = getGame();
    this.position.copy(vehicle.position);
    this.position2.set(this.position.x, this.position.z);
    view.focusPoint.trackedPosition.copy(this.position);

    const isSpeeding = Boolean(this.boosting && this.accelerating) && vehicle.speed > SPEED_LINES_SPEED;
    view.speedLines.strength = isSpeeding ? 1 : 0;
    view.speedLines.worldTarget.copy(this.position);
    tracks.focusPoint.set(this.position.x, this.position.z);

    this.rotationY = Math.atan2(vehicle.forward.z, vehicle.forward.x);
    inputs.nipple.setCoordinates(this.position, this.rotationY);

    const { justTouchedCount } = vehicle.wheels;
    if (justTouchedCount > LANDING_SOUND_WHEELS) {
      this.sounds.spring1.play(justTouchedCount);
      this.sounds.spring2.play(justTouchedCount);
    }
  }
}
