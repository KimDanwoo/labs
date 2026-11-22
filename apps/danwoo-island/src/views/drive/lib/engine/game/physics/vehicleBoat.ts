import type { Ray, RigidBody, Vector } from '@dimforge/rapier3d-compat';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { shouldBoat } from '@views/drive/lib/engine/game/physics/boatWaters';
import { edgePush, levelTorque, yawRate } from '@views/drive/lib/engine/game/physics/hoverForces';
import { GRAVITY, type PhysicsStep } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { UP } from '@views/drive/lib/engine/game/physics/vehicleConfig';
import { lerp } from '@views/drive/lib/engine/game/utilities/maths';

const PROBE = { height: 10, length: 20 } as const;
const DRY_GROUND = 0;
export const BOAT_FLOAT_ELEVATION = 0.4;
const FLOAT = { elevation: BOAT_FLOAT_ELEVATION, stiffness: 30, damping: 8 } as const;
const UPRIGHT = { stiffness: 12, damping: 4, yawGain: 4 } as const;
const THRUST = { forward: 7, reverseRatio: 0.5, boostRatio: 1.7 } as const;
const WATER_DRAG = { forward: 2.2, sideways: 3.5, brake: 3 } as const;
const YAW = { rate: 1.3, idleRatio: 0.35, topSpeed: 4, reverseSpeed: 0.3 } as const;

export class VehicleBoat {
  isActive = false;
  readonly #body: RigidBody;
  readonly #mass: number;
  readonly #ray: Ray;
  readonly #quaternion = new THREE.Quaternion();
  readonly #heading = new THREE.Vector3();
  readonly #side = new THREE.Vector3();
  readonly #upward = new THREE.Vector3();
  readonly #push = new THREE.Vector3();
  readonly #torque = new THREE.Vector3();

  constructor(chassis: { physical: { body: RigidBody }; mass: number }) {
    const game = getGame();
    this.#body = chassis.physical.body;
    this.#mass = chassis.mass;
    this.#ray = new game.RAPIER.Ray({ x: 0, y: PROBE.height, z: 0 }, { x: 0, y: -1, z: 0 });
    game.physics.events.on('step', (step) => this.#update(step));
  }

  #update(step: PhysicsStep): void {
    if (!this.#body.isEnabled()) return;
    const { x, y, z } = this.#body.translation();
    const isFlying = getGame().physicalVehicle.flight.isActive;
    this.isActive = shouldBoat({ isBoating: this.isActive, isFlying, x, z, elevation: y, seabed: this.#seabed(x, z) });
    if (!this.isActive) return;

    this.#quaternion.copy(this.#body.rotation());
    this.#heading.set(1, 0, 0).applyQuaternion(this.#quaternion).setY(0).normalize();
    this.#side.set(-this.#heading.z, 0, this.#heading.x);
    const velocity = this.#body.linvel();
    this.#applyPush(velocity, { x, y, z }, step.scaled);
    this.#applyTorque(velocity, step.scaled);
  }

  #seabed(x: number, z: number): number | null {
    const floor = getGame().world.floor?.physical.colliders[0];
    if (!floor) return DRY_GROUND;
    this.#ray.origin = { x, y: PROBE.height, z };
    const distance = floor.castRay(this.#ray, PROBE.length, true);
    return distance < 0 ? null : PROBE.height - distance;
  }

  #applyPush(velocity: Vector, position: Vector, delta: number): void {
    const { player } = getGame();
    const forwardSpeed = this.#heading.x * velocity.x + this.#heading.z * velocity.z;
    const sideSpeed = this.#side.x * velocity.x + this.#side.z * velocity.z;
    const lift = Math.max(0, -GRAVITY.y + FLOAT.stiffness * (FLOAT.elevation - position.y));
    const isWet = lift > 0;
    const sink = isWet ? FLOAT.damping * velocity.y : 0;
    const forwardDrag = WATER_DRAG.forward + player.braking * WATER_DRAG.brake;

    this.#push
      .copy(this.#heading)
      .multiplyScalar(this.#thrust() - forwardDrag * forwardSpeed)
      .addScaledVector(this.#side, -WATER_DRAG.sideways * sideSpeed);
    this.#push.x += edgePush(position.x);
    this.#push.y = lift - sink;
    this.#push.z += edgePush(position.z);
    this.#body.applyImpulse(this.#push.multiplyScalar(this.#mass * delta), true);
  }

  #thrust(): number {
    const { player } = getGame();
    const direction = player.accelerating < 0 ? THRUST.reverseRatio : 1;
    const boost = lerp(1, THRUST.boostRatio, player.boosting);
    return player.accelerating * direction * boost * THRUST.forward;
  }

  #applyTorque(velocity: Vector, delta: number): void {
    const forwardSpeed = this.#heading.x * velocity.x + this.#heading.z * velocity.z;
    this.#upward.copy(UP).applyQuaternion(this.#quaternion);
    const attitude = {
      upward: this.#upward,
      target: UP,
      spin: this.#body.angvel(),
      yawRate: yawRate(getGame().player.steering, forwardSpeed, YAW),
    };
    levelTorque(this.#torque, attitude, UPRIGHT);
    this.#body.applyTorqueImpulse(this.#torque.multiplyScalar(this.#mass * delta), true);
  }
}
