import type {
  Collider,
  ColliderDesc,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  Rotation,
  TempContactForceEvent,
  Vector,
  World,
} from '@dimforge/rapier3d-compat';

import { getGame } from '../gameContext';

export type BodyType = 'dynamic' | 'fixed' | 'kinematicPositionBased' | 'kinematicVelocityBased';
export type CollisionCategory = 'floor' | 'object' | 'bumper';
export type FrictionRule = 'average' | 'min' | 'max' | 'multiply';
export type CollisionHandler = (force: number, position: Vector) => void;

export type ShapeParameters =
  | { shape: 'cuboid'; parameters: [hx: number, hy: number, hz: number] }
  | { shape: 'ball'; parameters: [radius: number] }
  | { shape: 'cylinder'; parameters: [halfHeight: number, radius: number] }
  | { shape: 'trimesh'; parameters: [vertices: Float32Array, indices: Uint32Array] }
  | { shape: 'hull'; parameters: [points: Float32Array] }
  | { shape: 'heightfield'; parameters: [rows: number, columns: number, heights: Float32Array, scale: Vector] };

interface ColliderOptions {
  position?: Vector;
  quaternion?: Rotation;
  mass?: number;
  centerOfMass?: Vector;
  friction?: number;
  restitution?: number;
  category?: CollisionCategory;
}

export type ColliderDescription = ShapeParameters & ColliderOptions;

export interface PhysicalDescription {
  type?: BodyType;
  position?: Vector;
  rotation?: Rotation;
  canSleep?: boolean;
  sleeping?: boolean;
  enabled?: boolean;
  linearDamping?: number;
  angularDamping?: number;
  waterGravityMultiplier?: number;
  mass?: number;
  friction?: number;
  frictionRule?: FrictionRule;
  restitution?: number;
  category?: CollisionCategory;
  contactThreshold?: number;
  onCollision?: CollisionHandler;
  colliders: readonly ColliderDescription[];
  collidersOverwrite?: Partial<ColliderOptions>;
}

export interface Physical {
  type: BodyType;
  body: RigidBody;
  colliders: Collider[];
  linearDamping: number;
  angularDamping: number;
  waterGravityMultiplier: number;
  initialState: { position: Vector; rotation: Rotation; sleeping: boolean };
  onCollision?: CollisionHandler;
}

const GRAVITY = { x: 0, y: -9.81, z: 0 };
const GROUPS = { all: 0b1, object: 0b10, bumper: 0b100 } as const;
const MEMBERSHIP_SHIFT = 16;
const CATEGORIES: Record<CollisionCategory, number> = {
  floor: (GROUPS.all << MEMBERSHIP_SHIFT) | GROUPS.all,
  object: ((GROUPS.all | GROUPS.object) << MEMBERSHIP_SHIFT) | GROUPS.all | GROUPS.bumper,
  bumper: (GROUPS.bumper << MEMBERSHIP_SHIFT) | GROUPS.object,
};
const DEFAULTS = {
  waterGravityMultiplier: -1.5,
  damping: 0.1,
  density: 0.1,
  friction: 0.2,
  restitution: 0.15,
  contactThreshold: 15,
  category: 'object',
} as const;
const UNIT_INERTIA = { x: 1, y: 1, z: 1 };
const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };
const SUBMERGED_DAMPING = 1;
const TICK_ORDER = 3;

const isAtOrigin = ({ x, y, z }: Vector): boolean => x === 0 && y === 0 && z === 0;

function shapeDesc(description: ShapeParameters): ColliderDesc {
  const { ColliderDesc } = getGame().RAPIER;
  switch (description.shape) {
    case 'cuboid':
      return ColliderDesc.cuboid(...description.parameters);
    case 'ball':
      return ColliderDesc.ball(...description.parameters);
    case 'cylinder':
      return ColliderDesc.cylinder(...description.parameters);
    case 'trimesh':
      return ColliderDesc.trimesh(...description.parameters);
    case 'heightfield':
      return ColliderDesc.heightfield(...description.parameters);
    case 'hull': {
      const hull = ColliderDesc.convexHull(...description.parameters);
      if (!hull) throw new Error('Convex hull could not be built from the given points');
      return hull;
    }
    default: {
      const unknownShape: never = description;
      throw new Error(`Unknown collider shape: ${JSON.stringify(unknownShape)}`);
    }
  }
}

function bodyDesc(type: BodyType): RigidBodyDesc {
  const { RigidBodyDesc } = getGame().RAPIER;
  const createByType: Record<BodyType, () => RigidBodyDesc> = {
    dynamic: () => RigidBodyDesc.dynamic(),
    fixed: () => RigidBodyDesc.fixed(),
    kinematicPositionBased: () => RigidBodyDesc.kinematicPositionBased(),
    kinematicVelocityBased: () => RigidBodyDesc.kinematicVelocityBased(),
  };
  return createByType[type]();
}

export class Physics {
  readonly world: World;
  readonly #eventQueue: EventQueue;
  readonly #physicals: Physical[] = [];
  readonly #physicalByBody = new Map<number, Physical>();

  constructor() {
    const game = getGame();
    this.world = new game.RAPIER.World(GRAVITY);
    this.#eventQueue = new game.RAPIER.EventQueue(true);
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
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
    const game = getGame();
    this.world.timestep = game.ticker.deltaScaled;
    for (const physical of this.#physicals) this.#applyWaterDamping(physical, game.water.surfaceElevation);
    this.world.step(this.#eventQueue);
    this.#eventQueue.drainContactForceEvents((event) => this.#dispatchContact(event));
  }

  #applyWaterDamping({ body, linearDamping, angularDamping }: Physical, surfaceElevation: number): void {
    const waterDepth = Math.max(-body.translation().y, surfaceElevation);
    const isSubmerged = waterDepth > 0;
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
