import type { DynamicRayCastVehicleController, Vector } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { Events } from '@views/drive/lib/engine/game/events';
import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { Physical } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { VehicleBoat } from '@views/drive/lib/engine/game/physics/vehicleBoat';
import { createChassis, createWheels } from '@views/drive/lib/engine/game/physics/vehicleChassis';
import {
  DOWN,
  DRIVE,
  FLIP,
  SPAWN_POSITION,
  STOP_THRESHOLDS,
  STUCK,
  UP,
  UPSIDE_DOWN_THRESHOLD,
  type VehicleEvents,
  type VehicleWheel,
  type WheelSettings,
} from '@views/drive/lib/engine/game/physics/vehicleConfig';
import { FlipDetector, StuckDetector } from '@views/drive/lib/engine/game/physics/vehicleDetectors';
import {
  driveController,
  readWheelContacts,
  updateKinematics,
} from '@views/drive/lib/engine/game/physics/vehicleDrive';
import { VehicleFlight } from '@views/drive/lib/engine/game/physics/vehicleFlight';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

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
  readonly boat: VehicleBoat;
  readonly flight: VehicleFlight;
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
    this.chassis = createChassis(this.position);
    this.#controller = game.physics.world.createVehicleController(this.chassis.physical.body);
    this.wheels = createWheels(this.#controller);
    this.boat = new VehicleBoat(this.chassis);
    this.flight = new VehicleFlight(this.chassis);
    game.physics.events.on('step', (step) => driveController(this.#controller, this.speed, this.isGoingForward, step));
    game.ticker.events.on('tick', () => this.#updatePostPhysics(), TICK_ORDER.vehiclePostPhysics);
  }

  moveTo(position: Vector, rotation = 0): void {
    const { body } = this.chassis.physical;
    this.flight.cancel();
    body.setTranslation(position, false);
    body.setRotation(new THREE.Quaternion().setFromAxisAngle(UP, rotation), false);
    body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    this.position.set(position.x, position.y, position.z);
  }

  launch({
    upward,
    forward = 0,
    spin = 0,
    carry = 1,
  }: {
    upward: number;
    forward?: number;
    spin?: number;
    carry?: number;
  }): void {
    const { body } = this.chassis.physical;
    const { mass } = this.chassis;
    this.flight.cancel();
    const velocity = body.linvel();
    body.setLinvel({ x: velocity.x * carry, y: velocity.y, z: velocity.z * carry }, true);
    const heading = new THREE.Vector3(this.forward.x, 0, this.forward.z).normalize();
    const impulse = UP.clone()
      .multiplyScalar(upward * mass)
      .addScaledVector(heading, forward * mass);
    body.applyImpulse(impulse, true);
    if (spin !== 0) body.applyTorqueImpulse(UP.clone().multiplyScalar(spin * mass), true);
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

  #updatePostPhysics(): void {
    const { player, ticker } = getGame();
    updateKinematics(this);

    if (Math.abs(player.accelerating) > STUCK.accelerating)
      this.#stuck.accumulate(this.velocity.length(), ticker.deltaScaled);
    readWheelContacts(this.#controller, this.wheels);
    this.#testStop();
    this.#testUpsideDown();
    this.#testStuck();
    this.#testFlip();
  }

  #testStop(): void {
    const hasJustStopped = this.speed < STOP_THRESHOLDS.low && !this.#isStopped;
    const hasJustStarted = this.speed > STOP_THRESHOLDS.high && this.#isStopped;
    if (hasJustStopped) {
      this.#isStopped = true;
      this.events.trigger('stop');
    } else if (hasJustStarted) {
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
    if (this.flight.isActive) this.#flip.resetRotation();
    const direction = this.#flip.test(this.wheels.inContactCount, this.xRotation, this.zRotation);
    if (direction !== null) this.events.trigger('flip', direction);
  }
}
