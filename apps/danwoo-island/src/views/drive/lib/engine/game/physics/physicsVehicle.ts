import type { DynamicRayCastVehicleController, RigidBody, Vector } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { Events } from '../events';
import { getGame } from '../gameContext';
import { QUALITY } from '../quality';
import { lerp, smallestAngle } from '../utilities/maths';
import type { Physical } from './physics';

export type SuspensionState = 'low' | 'mid' | 'high';

export interface VehicleWheel {
  inContact: boolean;
  contactPoint: Vector | null;
  suspensionLength: number | null;
  lastTouchTime: number;
  readonly basePosition: THREE.Vector3;
}

interface WheelSettings {
  offset: Vector;
  radius: number;
  directionCs: Vector;
  axleCs: Vector;
  frictionSlip: number;
  maxSuspensionForce: number;
  maxSuspensionTravel: number;
  sideFrictionStiffness: number;
  suspensionCompression: number;
  suspensionRelaxation: number;
}

type VehicleEvents = {
  stop: [];
  start: [];
  upsideDown: [ratio: number];
  rightSideUp: [];
  stuck: [];
  unstuck: [];
  flip: [direction: number];
};

const WHEEL_COUNT = 4;
const STEERED_WHEELS = [0, 1];
const WHEEL_SETTINGS: WheelSettings = {
  offset: { x: 0.9, y: 0, z: 0.75 },
  radius: 0.4,
  directionCs: { x: 0, y: -1, z: 0 },
  axleCs: { x: 0, y: 0, z: 1 },
  frictionSlip: 0.9,
  maxSuspensionForce: 150,
  maxSuspensionTravel: 2,
  sideFrictionStiffness: 3,
  suspensionCompression: 10,
  suspensionRelaxation: 2.7,
};
const SUSPENSION_HEIGHTS: Record<SuspensionState, number> = { low: 0.88, mid: 1.23, high: 1.63 };
const SUSPENSION_STIFFNESS: Record<SuspensionState, number> = { low: 20, mid: 30, high: 40 };
const DRIVE = {
  steeringAmplitude: 0.5,
  engineForceAmplitude: 300,
  boostMultiplier: 2,
  topSpeed: 5,
  topSpeedBoost: 40,
  brakeAmplitude: 35,
  idleBrake: 0.06,
  reverseBrake: 0.4,
  idleAcceleration: 0.1,
  reverseSpeed: 0.5,
} as const;
const STOP_THRESHOLDS = { low: 0.04, high: 0.7 } as const;
const UPSIDE_DOWN_THRESHOLD = 0.3;
const STUCK = { duration: 3, distance: 0.5, accelerating: 0.5 } as const;
const FLIP = { force: 5, maxPitch: 1, minRoll: 5, pitchTorque: 0.8, rollTorque: 0.4 } as const;
const ICE_FRICTION_SLIP = 0.04;
const JUST_TOUCHED_WINDOW = 0.2;
const FORWARD_RATIO_THRESHOLD = 0.5;
const FIXED_STEP = 1 / 60;
const SPAWN_POSITION = new THREE.Vector3(0, 4, 0);
const CHASSIS_FRICTION = 0.4;
const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);
const TICK_ORDER = { prePhysics: 2, postPhysics: 5 } as const;

const SUSPENSION_STATES = new Set<unknown>(['low', 'mid', 'high']);

function isSuspensionState(value: unknown): value is SuspensionState {
  return SUSPENSION_STATES.has(value);
}

function suspensionAt(index: number): SuspensionState {
  const value: unknown = getGame().player.suspensions[index];
  return isSuspensionState(value) ? value : 'low';
}

function wheelPositions({ offset }: WheelSettings): THREE.Vector3[] {
  return [
    new THREE.Vector3(offset.x, offset.y, offset.z),
    new THREE.Vector3(offset.x, offset.y, -offset.z),
    new THREE.Vector3(-offset.x, offset.y, offset.z),
    new THREE.Vector3(-offset.x, offset.y, -offset.z),
  ];
}

class StuckDetector {
  active = false;
  #samples: [distance: number, duration: number][] = [];
  #distance = 0;
  #duration = 0;

  accumulate(distance: number, duration: number): void {
    this.#samples.unshift([distance, duration]);
    this.#distance = 0;
    this.#duration = 0;
    for (const [index, [sampleDistance, sampleDuration]] of this.#samples.entries()) {
      if (this.#duration >= STUCK.duration) {
        this.#samples.splice(index);
        break;
      }
      this.#distance += sampleDistance;
      this.#duration += sampleDuration;
    }
  }

  get isStuck(): boolean {
    return this.#duration >= STUCK.duration && this.#distance < STUCK.distance;
  }
}

class FlipDetector {
  #isInAir = false;
  #previousPitch = 0;
  #pitch = 0;
  #previousRoll = 0;
  #roll = 0;

  test(contactCount: number, pitch: number, roll: number): number | null {
    if (contactCount === 0 && !this.#isInAir) {
      this.#isInAir = true;
      this.#previousPitch = pitch;
      this.#pitch = 0;
      this.#previousRoll = roll;
      this.#roll = 0;
    }

    if (contactCount < WHEEL_COUNT) {
      if (this.#isInAir) {
        this.#pitch += smallestAngle(this.#previousPitch, pitch);
        this.#previousPitch = pitch;
        this.#roll += smallestAngle(this.#previousRoll, roll);
        this.#previousRoll = roll;
      }
      return null;
    }

    if (!this.#isInAir) return null;
    this.#isInAir = false;
    const isFlip = Math.abs(this.#pitch) < FLIP.maxPitch && Math.abs(this.#roll) > FLIP.minRoll;
    return isFlip ? Math.sign(this.#roll) : null;
  }

  resetRotation(): void {
    this.#pitch = 0;
    this.#roll = 0;
  }
}

export class PhysicsVehicle {
  readonly events = new Events<VehicleEvents>();
  readonly steeringAmplitude = DRIVE.steeringAmplitude;
  readonly sideward = new THREE.Vector3(0, 0, 1);
  readonly upward = new THREE.Vector3(0, 1, 0);
  readonly forward = new THREE.Vector3(1, 0, 0);
  readonly position = SPAWN_POSITION.clone();
  readonly quaternion = new THREE.Quaternion();
  readonly velocity = new THREE.Vector3();
  readonly direction = this.forward.clone();
  speed = 0;
  xzSpeed = 0;
  forwardRatio = 0;
  forwardSpeed = 0;
  isGoingForward = false;
  xRotation = 0;
  yRotation = 0;
  zRotation = 0;

  readonly chassis: { physical: Physical; mass: number };
  readonly wheels: {
    items: VehicleWheel[];
    settings: WheelSettings;
    perimeter: number;
    inContactCount: number;
    justTouchedCount: number;
  };
  readonly upsideDown = { active: false, ratio: 0 };
  readonly flip = { jump: (): void => this.#jump() };

  readonly #controller: DynamicRayCastVehicleController;
  readonly #stuck = new StuckDetector();
  readonly #flip = new FlipDetector();
  #isStopped = true;

  constructor() {
    const game = getGame();
    this.chassis = this.#createChassis();
    this.#controller = game.physics.world.createVehicleController(this.chassis.physical.body);
    this.wheels = this.#createWheels();
    game.ticker.events.on('tick', () => this.#updatePrePhysics(), TICK_ORDER.prePhysics);
    game.ticker.events.on('tick', () => this.#updatePostPhysics(), TICK_ORDER.postPhysics);
  }

  #createChassis(): { physical: Physical; mass: number } {
    const game = getGame();
    const { physical } = game.objects.add(null, {
      type: 'dynamic',
      position: this.position,
      friction: CHASSIS_FRICTION,
      rotation: new THREE.Quaternion(),
      colliders: [
        {
          shape: 'cuboid',
          mass: 2.5,
          parameters: [1.3, 0.4, 0.85],
          position: { x: 0, y: -0.1, z: 0 },
          centerOfMass: { x: 0, y: -0.5, z: 0 },
        },
        { shape: 'cuboid', mass: 0, parameters: [0.5, 0.15, 0.65], position: { x: 0, y: 0.4, z: 0 } },
        {
          shape: 'cuboid',
          mass: 0,
          parameters: [1.5, 0.5, 0.9],
          position: { x: 0.1, y: -0.2, z: 0 },
          category: 'bumper',
        },
      ],
      canSleep: false,
      waterGravityMultiplier: 0,
      onCollision: (force, position) => game.audio.groups.get('hitDefault').playRandomNext(force, position),
    });
    if (!physical) throw new Error('Vehicle chassis has no physical body');
    return { physical, mass: physical.body.mass() };
  }

  #createWheels(): PhysicsVehicle['wheels'] {
    const { elapsed } = getGame().ticker;
    const positions = wheelPositions(WHEEL_SETTINGS);
    const items = positions.map((basePosition): VehicleWheel => {
      this.#controller.addWheel(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), 1, 1);
      return { inContact: false, contactPoint: null, suspensionLength: null, lastTouchTime: elapsed, basePosition };
    });
    for (const [index, wheel] of items.entries()) this.#configureWheel(index, wheel);
    return {
      items,
      settings: WHEEL_SETTINGS,
      perimeter: WHEEL_SETTINGS.radius * Math.PI * 2,
      inContactCount: 0,
      justTouchedCount: 0,
    };
  }

  #configureWheel(index: number, { basePosition }: VehicleWheel): void {
    const controller = this.#controller;
    const settings = WHEEL_SETTINGS;
    controller.setWheelDirectionCs(index, settings.directionCs);
    controller.setWheelAxleCs(index, settings.axleCs);
    controller.setWheelRadius(index, settings.radius);
    controller.setWheelChassisConnectionPointCs(index, basePosition);
    controller.setWheelFrictionSlip(index, settings.frictionSlip);
    controller.setWheelMaxSuspensionForce(index, settings.maxSuspensionForce);
    controller.setWheelMaxSuspensionTravel(index, settings.maxSuspensionTravel);
    controller.setWheelSideFrictionStiffness(index, settings.sideFrictionStiffness);
    controller.setWheelSuspensionCompression(index, settings.suspensionCompression);
    controller.setWheelSuspensionRelaxation(index, settings.suspensionRelaxation);
  }

  moveTo(position: Vector, rotation = 0): void {
    const { body } = this.chassis.physical;
    body.setTranslation(position, false);
    body.setRotation(new THREE.Quaternion().setFromAxisAngle(UP, rotation), false);
    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    this.position.set(position.x, position.y, position.z);
  }

  activate(): void {
    const { body } = this.chassis.physical;
    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    body.setEnabled(true);
  }

  deactivate(): void {
    this.chassis.physical.body.setEnabled(false);
  }

  #jump(): void {
    const { body } = this.chassis.physical;
    const { mass } = this.chassis;
    this.#flip.resetRotation();

    const sidewardDot = UP.dot(this.sideward);
    const forwardDot = UP.dot(this.forward);
    const upwardDot = UP.dot(this.upward);
    body.applyImpulse(UP.clone().multiplyScalar(FLIP.force * mass), false);

    const isUpright = Math.abs(upwardDot) > Math.abs(sidewardDot) && Math.abs(upwardDot) > Math.abs(forwardDot);
    const torque = isUpright
      ? new THREE.Vector3(FLIP.pitchTorque * mass, 0, 0)
      : new THREE.Vector3(sidewardDot * FLIP.rollTorque * mass, 0, -forwardDot * FLIP.pitchTorque * mass);
    body.applyTorqueImpulse(torque.applyQuaternion(body.rotation()), false);
  }

  #engineAndBrake(): { engineForce: number; brake: number } {
    const { player, ticker } = getGame();
    const topSpeed = lerp(DRIVE.topSpeed, DRIVE.topSpeedBoost, player.boosting);
    const overflowSpeed = Math.max(0, this.speed - topSpeed);
    const boost = 1 + player.boosting * DRIVE.boostMultiplier;
    const engineForce =
      ((player.accelerating * boost * DRIVE.engineForceAmplitude) / (1 + overflowSpeed)) * ticker.deltaScaled;

    const isIdle = !player.braking && Math.abs(player.accelerating) < DRIVE.idleAcceleration;
    const isReversing =
      this.speed > DRIVE.reverseSpeed &&
      ((player.accelerating > 0 && !this.isGoingForward) || (player.accelerating < 0 && this.isGoingForward));
    const idleOrPlayerBrake = isIdle ? DRIVE.idleBrake : player.braking;
    const baseBrake = isReversing ? DRIVE.reverseBrake : idleOrPlayerBrake;
    return {
      engineForce: isReversing ? 0 : engineForce,
      brake: baseBrake * DRIVE.brakeAmplitude * ticker.deltaScaled,
    };
  }

  #frictionSlip(groundBody: RigidBody | null): number {
    const { waterSurface } = getGame().world;
    const iceRatio = waterSurface?.iceRatio;
    const isOnIce = waterSurface?.ice !== undefined && groundBody === waterSurface.ice.physical.body;
    if (!isOnIce || !iceRatio) return WHEEL_SETTINGS.frictionSlip;
    return lerp(WHEEL_SETTINGS.frictionSlip, ICE_FRICTION_SLIP, iceRatio.value);
  }

  #updatePrePhysics(): void {
    const game = getGame();
    const controller = this.#controller;
    const { engineForce, brake } = this.#engineAndBrake();
    const steer = game.player.steering * DRIVE.steeringAmplitude;
    for (const index of STEERED_WHEELS) controller.setWheelSteering(index, steer);

    for (let index = 0; index < WHEEL_COUNT; index += 1) {
      const suspension = suspensionAt(index);
      controller.setWheelBrake(index, brake);
      controller.setWheelEngineForce(index, engineForce);
      controller.setWheelSuspensionRestLength(index, SUSPENSION_HEIGHTS[suspension]);
      controller.setWheelSuspensionStiffness(index, SUSPENSION_STIFFNESS[suspension]);
      const groundObject = controller.wheelGroundObject(index);
      if (groundObject && game.world.waterSurface) {
        controller.setWheelFrictionSlip(index, this.#frictionSlip(groundObject.parent()));
      }
    }

    const isLowQuality = game.quality.level === QUALITY.low;
    controller.updateVehicle(isLowQuality ? FIXED_STEP : Math.min(FIXED_STEP, game.ticker.deltaAverage));
  }

  #updatePostPhysics(): void {
    const { player, ticker } = getGame();
    const { body } = this.chassis.physical;
    const newPosition = new THREE.Vector3().copy(body.translation());
    this.velocity.copy(newPosition).sub(this.position);
    this.direction.copy(this.velocity).normalize();
    this.position.copy(newPosition);
    this.quaternion.copy(body.rotation());
    this.sideward.set(0, 0, 1).applyQuaternion(this.quaternion);
    this.upward.set(0, 1, 0).applyQuaternion(this.quaternion);
    this.forward.set(1, 0, 0).applyQuaternion(this.quaternion);
    this.speed = this.velocity.length() / ticker.deltaScaled;
    this.xzSpeed = Math.hypot(this.velocity.x, this.velocity.z) / ticker.deltaScaled;
    this.forwardRatio = this.direction.dot(this.forward);
    this.isGoingForward = this.forwardRatio > FORWARD_RATIO_THRESHOLD;
    this.forwardSpeed = this.speed * this.forwardRatio;
    this.xRotation = new THREE.Euler().setFromQuaternion(this.quaternion, 'XYZ').x;
    this.yRotation = new THREE.Euler().setFromQuaternion(this.quaternion, 'YXZ').y;
    this.zRotation = new THREE.Euler().setFromQuaternion(this.quaternion, 'ZYX').z;

    if (Math.abs(player.accelerating) > STUCK.accelerating)
      this.#stuck.accumulate(this.velocity.length(), ticker.deltaScaled);
    this.#updateWheels();
    this.#testStop();
    this.#testUpsideDown();
    this.#testStuck();
    this.#testFlip();
  }

  #updateWheels(): void {
    const { elapsed } = getGame().ticker;
    const controller = this.#controller;
    let inContactCount = 0;
    for (const [index, wheel] of this.wheels.items.entries()) {
      const inContact = controller.wheelIsInContact(index);
      if (inContact && !wheel.inContact) wheel.lastTouchTime = elapsed;
      wheel.inContact = inContact;
      wheel.contactPoint = controller.wheelContactPoint(index);
      wheel.suspensionLength = controller.wheelSuspensionLength(index);
      if (inContact) inContactCount += 1;
    }

    const hasLanded = inContactCount > this.wheels.inContactCount;
    const isRecent = (wheel: VehicleWheel): boolean => wheel.lastTouchTime > elapsed - JUST_TOUCHED_WINDOW;
    this.wheels.justTouchedCount = hasLanded ? this.wheels.items.filter(isRecent).length : 0;
    this.wheels.inContactCount = inContactCount;
  }

  #testStop(): void {
    if (this.speed < STOP_THRESHOLDS.low && !this.#isStopped) {
      this.#isStopped = true;
      this.events.trigger('stop');
    } else if (this.speed > STOP_THRESHOLDS.high && this.#isStopped) {
      this.#isStopped = false;
      this.events.trigger('start');
    }
  }

  #testUpsideDown(): void {
    const { upsideDown } = this;
    upsideDown.ratio = this.upward.dot(DOWN) * 0.5 + 0.5;
    const isUpsideDown = upsideDown.ratio > UPSIDE_DOWN_THRESHOLD;
    if (isUpsideDown === upsideDown.active) return;
    upsideDown.active = isUpsideDown;
    if (isUpsideDown) this.events.trigger('upsideDown', upsideDown.ratio);
    else this.events.trigger('rightSideUp');
  }

  #testStuck(): void {
    const isStuck = this.#stuck.isStuck;
    if (isStuck === this.#stuck.active) return;
    this.#stuck.active = isStuck;
    this.events.trigger(isStuck ? 'stuck' : 'unstuck');
  }

  #testFlip(): void {
    const direction = this.#flip.test(this.wheels.inContactCount, this.xRotation, this.zRotation);
    if (direction !== null) this.events.trigger('flip', direction);
  }
}
