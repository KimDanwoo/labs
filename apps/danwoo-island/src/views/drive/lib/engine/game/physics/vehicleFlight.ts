import type { Cuboid, Ray, RigidBody, Vector } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import {
  climbSpeed,
  cruiseSpeed,
  FLIGHT_ALTITUDE,
  hasTouchedDown,
  landingSpeed,
  leanAngles,
  steerAltitude,
  takeoffAltitude,
} from '@views/drive/lib/engine/game/physics/flightControl';
import { edgePush, levelTorque } from '@views/drive/lib/engine/game/physics/hoverForces';
import { GRAVITY, type PhysicsStep } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { UP } from '@views/drive/lib/engine/game/physics/vehicleConfig';

const FLIGHT_PHASE = { grounded: 'grounded', flying: 'flying', landing: 'landing' } as const;
type FlightPhase = (typeof FLIGHT_PHASE)[keyof typeof FLIGHT_PHASE];

const RESPONSE = { horizontal: 3.5, vertical: 4 } as const;
const YAW_RATE = 1.6;
const LEVEL = { stiffness: 14, damping: 5, yawGain: 4 } as const;
const PROBE = { reach: 60, lookahead: 1.6, headroom: 6, beyond: 1, minSpeed: 0.5 } as const;
const HULL = { x: 1.5, y: 0.5, z: 0.9 } as const;
const GROUND_MARGIN = 0.3;
const CORRIDOR = {
  halfHeight: (HULL.y + FLIGHT_ALTITUDE.clearance - GROUND_MARGIN) / 2,
  offset: (HULL.y - FLIGHT_ALTITUDE.clearance + GROUND_MARGIN) / 2,
} as const;
const DOWNWARD = { x: 0, y: -1, z: 0 } as const;
const FORWARD = new THREE.Vector3(1, 0, 0);

export class VehicleFlight {
  phase: FlightPhase = FLIGHT_PHASE.grounded;
  readonly #body: RigidBody;
  readonly #mass: number;
  readonly #ray: Ray;
  readonly #hull: Cuboid;
  readonly #corridor: Cuboid;
  readonly #sweep = new THREE.Vector3();
  readonly #quaternion = new THREE.Quaternion();
  readonly #yaw = new THREE.Quaternion();
  readonly #heading = new THREE.Vector3();
  readonly #side = new THREE.Vector3();
  readonly #upward = new THREE.Vector3();
  readonly #lean = new THREE.Vector3();
  readonly #push = new THREE.Vector3();
  readonly #torque = new THREE.Vector3();
  #target = 0;
  #ground = 0;

  constructor(chassis: { physical: { body: RigidBody }; mass: number }) {
    const game = getGame();
    this.#body = chassis.physical.body;
    this.#mass = chassis.mass;
    this.#ray = new game.RAPIER.Ray({ x: 0, y: 0, z: 0 }, DOWNWARD);
    this.#hull = new game.RAPIER.Cuboid(HULL.x, HULL.y, HULL.z);
    this.#corridor = new game.RAPIER.Cuboid(HULL.x, CORRIDOR.halfHeight, HULL.z);
    game.physics.events.on('step', (step) => this.#update(step));
  }

  get isActive(): boolean {
    return this.phase !== FLIGHT_PHASE.grounded;
  }

  toggle(): void {
    if (this.phase === FLIGHT_PHASE.flying) {
      this.phase = FLIGHT_PHASE.landing;
      return;
    }
    const isRacing = getGame().world.areas?.circuit?.isRacing ?? false;
    const canTakeOff = this.#body.isEnabled() && !isRacing;
    if (!canTakeOff) return;
    this.#target = takeoffAltitude(this.#body.translation().y);
    this.phase = FLIGHT_PHASE.flying;
  }

  cancel(): void {
    this.phase = FLIGHT_PHASE.grounded;
  }

  #update(step: PhysicsStep): void {
    if (!this.isActive) return;
    if (!this.#body.isEnabled()) return;
    const position = this.#body.translation();
    const velocity = this.#body.linvel();
    this.#quaternion.copy(this.#body.rotation());
    this.#heading.set(1, 0, 0).applyQuaternion(this.#quaternion).setY(0).normalize();
    this.#side.set(-this.#heading.z, 0, this.#heading.x);
    this.#yaw.setFromUnitVectors(FORWARD, this.#heading);
    this.#ground = this.#probeGround(position, velocity);
    const wheelContacts = getGame().physicalVehicle.wheels.inContactCount;
    const isLanded = this.phase === FLIGHT_PHASE.landing && hasTouchedDown({ elevation: position.y, wheelContacts });
    if (isLanded) {
      this.cancel();
      return;
    }
    this.#applyPush(velocity, position, step.scaled);
    this.#applyTorque(this.#forwardSpeed(velocity), step.scaled);
  }

  #probeGround(position: Vector, velocity: Vector): number {
    const below = this.#castDown(position.x, position.y, position.z);
    return Math.max(below, this.#obstacleAhead(position, velocity), getGame().water.surfaceAt(position.x, position.z));
  }

  #obstacleAhead(position: Vector, velocity: Vector): number {
    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed < PROBE.minSpeed) return -Infinity;
    const { physics, RAPIER } = getGame();
    const rotation = this.#yaw;
    const corridor = { x: position.x, y: position.y + CORRIDOR.offset, z: position.z };
    const flags = RAPIER.QueryFilterFlags.EXCLUDE_SENSORS;
    this.#sweep.set(velocity.x / speed, 0, velocity.z / speed);
    const reach = speed * PROBE.lookahead;
    const hit = physics.world.castShape(
      corridor,
      rotation,
      this.#sweep,
      this.#corridor,
      0,
      reach,
      true,
      flags,
      undefined,
      undefined,
      this.#body,
    );
    if (!hit) return -Infinity;
    const distance = hit.time_of_impact + PROBE.beyond;
    const above = {
      x: position.x + this.#sweep.x * distance,
      y: position.y + PROBE.headroom,
      z: position.z + this.#sweep.z * distance,
    };
    const top = physics.world.castShape(
      above,
      rotation,
      DOWNWARD,
      this.#hull,
      0,
      PROBE.reach,
      true,
      flags,
      undefined,
      undefined,
      this.#body,
    );
    return top ? above.y - top.time_of_impact - HULL.y : -Infinity;
  }

  #castDown(x: number, y: number, z: number): number {
    const { physics, RAPIER } = getGame();
    this.#ray.origin = { x, y, z };
    const hit = physics.world.castRay(
      this.#ray,
      PROBE.reach,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      undefined,
      this.#body,
    );
    return hit ? y - hit.timeOfImpact : -Infinity;
  }

  #verticalSpeed(elevation: number, delta: number): number {
    const { player, inputs } = getGame();
    const isClimbing = inputs.actions.get('suspensions')?.active ?? false;
    const ground = this.#ground;
    if (this.phase === FLIGHT_PHASE.landing) return landingSpeed({ elevation, ground });
    const input = Number(isClimbing) - player.braking;
    this.#target = steerAltitude({ target: this.#target, ground, input, delta });
    return climbSpeed({ elevation, ground, target: this.#target });
  }

  #forwardSpeed(velocity: Vector): number {
    return this.#heading.x * velocity.x + this.#heading.z * velocity.z;
  }

  #applyPush(velocity: Vector, position: Vector, delta: number): void {
    const { player } = getGame();
    const cruise = cruiseSpeed(player.accelerating, player.boosting);
    const verticalSpeed = this.#verticalSpeed(position.y, delta);
    this.#push.set(
      RESPONSE.horizontal * (this.#heading.x * cruise - velocity.x) + edgePush(position.x),
      -GRAVITY.y + RESPONSE.vertical * (verticalSpeed - velocity.y),
      RESPONSE.horizontal * (this.#heading.z * cruise - velocity.z) + edgePush(position.z),
    );
    this.#body.applyImpulse(this.#push.multiplyScalar(this.#mass * delta), true);
  }

  #applyTorque(forwardSpeed: number, delta: number): void {
    const { player } = getGame();
    const turn = player.steering * YAW_RATE;
    const { pitch, bank } = leanAngles(forwardSpeed, player.steering);
    this.#lean
      .copy(UP)
      .addScaledVector(this.#side, -Math.tan(bank))
      .addScaledVector(this.#heading, Math.tan(pitch))
      .normalize();
    this.#upward.copy(UP).applyQuaternion(this.#quaternion);
    const attitude = { upward: this.#upward, target: this.#lean, spin: this.#body.angvel(), yawRate: turn };
    levelTorque(this.#torque, attitude, LEVEL);
    this.#body.applyTorqueImpulse(this.#torque.multiplyScalar(this.#mass * delta), true);
  }
}
