import type { Collider, ColliderDesc, RigidBody, RigidBodyDesc, Rotation, Vector } from '@dimforge/rapier3d-compat';
import { getGame } from '@views/drive/lib/engine/game/gameContext';

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
export const GRAVITY = { x: 0, y: -9.81, z: 0 };
const GROUPS = { all: 0b1, object: 0b10, bumper: 0b100 } as const;
const MEMBERSHIP_SHIFT = 16;
export const CATEGORIES: Record<CollisionCategory, number> = {
  floor: (GROUPS.all << MEMBERSHIP_SHIFT) | GROUPS.all,
  object: ((GROUPS.all | GROUPS.object) << MEMBERSHIP_SHIFT) | GROUPS.all | GROUPS.bumper,
  bumper: (GROUPS.bumper << MEMBERSHIP_SHIFT) | GROUPS.object,
};
export const DEFAULTS = {
  waterGravityMultiplier: -1.5,
  damping: 0.1,
  density: 0.1,
  friction: 0.2,
  restitution: 0.15,
  contactThreshold: 15,
  category: 'object',
} as const;
export const UNIT_INERTIA = { x: 1, y: 1, z: 1 };
export const IDENTITY_ROTATION = { x: 0, y: 0, z: 0, w: 1 };
export const SUBMERGED_DAMPING = 1;
export const isAtOrigin = ({ x, y, z }: Vector): boolean => x === 0 && y === 0 && z === 0;
export function shapeDesc(description: ShapeParameters): ColliderDesc {
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
export function bodyDesc(type: BodyType): RigidBodyDesc {
  const { RigidBodyDesc } = getGame().RAPIER;
  const createByType: Record<BodyType, () => RigidBodyDesc> = {
    dynamic: () => RigidBodyDesc.dynamic(),
    fixed: () => RigidBodyDesc.fixed(),
    kinematicPositionBased: () => RigidBodyDesc.kinematicPositionBased(),
    kinematicVelocityBased: () => RigidBodyDesc.kinematicVelocityBased(),
  };
  return createByType[type]();
}

export const MAX_STEP_SCALED = 1 / 30;
const STEP_TOLERANCE = 0.05;

export interface PhysicsStep {
  count: number;
  scaled: number;
  real: number;
}

export function splitStep(deltaScaled: number, scale: number): PhysicsStep {
  const count = Math.max(1, Math.ceil(deltaScaled / MAX_STEP_SCALED - STEP_TOLERANCE));
  const scaled = deltaScaled / count;
  return { count, scaled, real: scale > 0 ? scaled / scale : 0 };
}
