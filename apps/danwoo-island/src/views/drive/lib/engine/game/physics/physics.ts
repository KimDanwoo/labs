import type { ColliderDesc, EventQueue, TempContactForceEvent, World } from '@dimforge/rapier3d-compat';

import { Events } from '../events';
import { getGame } from '../gameContext';
import { TICK_ORDER } from '../tickOrder';
import {
  bodyDesc,
  CATEGORIES,
  type ColliderDescription,
  DEFAULTS,
  type FrictionRule,
  GRAVITY,
  IDENTITY_ROTATION,
  isAtOrigin,
  type Physical,
  type PhysicalDescription,
  type PhysicsStep,
  shapeDesc,
  splitStep,
  SUBMERGED_DAMPING,
  UNIT_INERTIA,
} from './physicsTypes';

export class Physics {
  readonly events = new Events<{ step: [PhysicsStep] }>();
  readonly world: World;
  readonly #eventQueue: EventQueue;
  readonly #physicals: Physical[] = [];
  readonly #submerged = new WeakMap<Physical, boolean>();
  readonly #physicalByBody = new Map<number, Physical>();

  constructor() {
    const game = getGame();
    this.world = new game.RAPIER.World(GRAVITY);
    this.#eventQueue = new game.RAPIER.EventQueue(true);
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.physics);
  }

  getPhysical(description: PhysicalDescription): Physical {
    const type = description.type ?? 'dynamic';
    const linearDamping = description.linearDamping ?? DEFAULTS.damping;
    const angularDamping = description.angularDamping ?? DEFAULTS.damping;

    const desc = bodyDesc(type);
    if (description.position)
      desc.setTranslation(description.position.x, description.position.y, description.position.z);
    if (description.rotation) desc.setRotation(description.rotation);
    if (description.canSleep !== undefined) desc.setCanSleep(description.canSleep);
    desc.setLinearDamping(linearDamping);
    desc.setAngularDamping(angularDamping);
    if (description.sleeping !== undefined) desc.setSleeping(description.sleeping);
    if (description.enabled !== undefined) desc.setEnabled(description.enabled);

    const body = this.world.createRigidBody(desc);
    const colliders = description.colliders.map((collider) =>
      this.world.createCollider(
        this.#colliderDesc({ ...collider, ...description.collidersOverwrite }, description),
        body,
      ),
    );
    const physical: Physical = {
      type,
      body,
      colliders,
      linearDamping,
      angularDamping,
      waterGravityMultiplier: description.waterGravityMultiplier ?? DEFAULTS.waterGravityMultiplier,
      initialState: { position: body.translation(), rotation: body.rotation(), sleeping: body.isSleeping() },
      onCollision: colliders.length > 0 ? description.onCollision : undefined,
    };

    this.#physicals.push(physical);
    this.#physicalByBody.set(body.handle, physical);
    return physical;
  }

  #colliderDesc(collider: ColliderDescription, description: PhysicalDescription): ColliderDesc {
    const { RAPIER } = getGame();
    let desc = shapeDesc(collider);
    if (collider.position) desc = desc.setTranslation(collider.position.x, collider.position.y, collider.position.z);
    if (collider.quaternion) desc = desc.setRotation(collider.quaternion);
    desc = desc.setDensity(DEFAULTS.density);

    if (collider.mass !== undefined) {
      desc = collider.centerOfMass
        ? desc.setMassProperties(collider.mass, collider.centerOfMass, UNIT_INERTIA, IDENTITY_ROTATION)
        : desc.setMass(collider.mass);
    }
    if (description.mass !== undefined) desc = desc.setMass(description.mass / description.colliders.length);

    desc = desc.setFriction(description.friction ?? collider.friction ?? DEFAULTS.friction);
    if (description.frictionRule) desc = desc.setFrictionCombineRule(this.#frictionRule(description.frictionRule));
    desc = desc.setRestitution(description.restitution ?? collider.restitution ?? DEFAULTS.restitution);
    desc = desc.setCollisionGroups(CATEGORIES[description.category ?? collider.category ?? DEFAULTS.category]);

    const hasContactEvents = description.onCollision !== undefined || description.contactThreshold !== undefined;
    if (hasContactEvents) {
      desc = desc
        .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
        .setContactForceEventThreshold(description.contactThreshold ?? DEFAULTS.contactThreshold);
    }
    return desc;
  }

  #frictionRule(rule: FrictionRule): number {
    const { CoefficientCombineRule } = getGame().RAPIER;
    const rules: Record<FrictionRule, number> = {
      average: CoefficientCombineRule.Average,
      min: CoefficientCombineRule.Min,
      max: CoefficientCombineRule.Max,
      multiply: CoefficientCombineRule.Multiply,
    };
    return rules[rule];
  }

  update(): void {
    const { ticker, water } = getGame();
    const step = splitStep(ticker.deltaScaled, ticker.scale);
    this.world.timestep = step.scaled;
    for (let index = 0; index < step.count; index += 1) this.#step(step, water.surfaceElevation);
  }

  #step(step: PhysicsStep, surfaceElevation: number): void {
    this.events.trigger('step', step);
    for (const physical of this.#physicals) this.#applyWaterDamping(physical, surfaceElevation);
    this.world.step(this.#eventQueue);
    this.#eventQueue.drainContactForceEvents((event) => this.#dispatchContact(event));
  }

  #applyWaterDamping(physical: Physical, surfaceElevation: number): void {
    const { body, linearDamping, angularDamping } = physical;
    if (!body.isDynamic() || !body.isEnabled() || body.isSleeping()) return;
    const isSubmerged = Math.max(-body.translation().y, surfaceElevation) > 0;
    if (this.#submerged.get(physical) === isSubmerged) return;
    this.#submerged.set(physical, isSubmerged);
    body.setLinearDamping(isSubmerged ? SUBMERGED_DAMPING : linearDamping);
    body.setAngularDamping(isSubmerged ? SUBMERGED_DAMPING : angularDamping);
  }

  #dispatchContact(event: TempContactForceEvent): void {
    const body1 = this.world.getCollider(event.collider1()).parent();
    const body2 = this.world.getCollider(event.collider2()).parent();
    if (!body1 || !body2) return;

    const onCollision1 = this.#physicalByBody.get(body1.handle)?.onCollision;
    const onCollision2 = this.#physicalByBody.get(body2.handle)?.onCollision;
    if (!onCollision1 && !onCollision2) return;

    const force = event.maxForceMagnitude() / (body1.mass() + body2.mass());
    const position1 = body1.translation();
    const position = isAtOrigin(position1) ? body2.translation() : position1;
    onCollision1?.(force, position);
    onCollision2?.(force, position);
  }
}
