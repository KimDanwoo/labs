import { Vector3, type InstancedMesh, type Object3D } from 'three';
import { SUNSET_ARCH } from '../../config/sunsetArch';

type Vec3 = [number, number, number];

export interface ArchBlock {
  key: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  color: string;
}

export interface ArchRock {
  key: number;
  position: Vec3;
  rotation: Vec3;
  radius: number;
}

const PILLAR_COLORS = ['#bcb29b', '#aaa18b'] as const;
const KEYSTONE_COLORS = ['#a99d88', '#c4b79e'] as const;
const GOLDEN_ANGLE = 2.39996;

export function pillarBlocks(): ArchBlock[] {
  return SUNSET_ARCH.pillarSides.flatMap((side) =>
    Array.from({ length: SUNSET_ARCH.pillarBlocks }, (_, i) => ({
      key: `${side}-${i}`,
      position: [side * (7 + (i % 2) * 0.12), 1.1 + i * 2.2, 0] as Vec3,
      rotation: [0.025 * i, side * 0.06, side * 0.025] as Vec3,
      scale: [3.1 - i * 0.12, 2.1, 3.4] as Vec3,
      color: PILLAR_COLORS[i % 2]!,
    })),
  );
}

export function keystoneBlocks(): ArchBlock[] {
  return Array.from({ length: SUNSET_ARCH.keystones }, (_, i) => {
    const a = ((i + 0.5) * Math.PI) / SUNSET_ARCH.keystones;
    return {
      key: `key-${i}`,
      position: [Math.cos(a) * 7, 9 + Math.sin(a) * 7, ((i % 3) - 1) * 0.2] as Vec3,
      rotation: [0, 0, a - Math.PI / 2 + (i % 2) * 0.035] as Vec3,
      scale: [2.1, 2.8, 3.2] as Vec3,
      color: KEYSTONE_COLORS[i % 2]!,
    };
  });
}

export function floatingRocks(): ArchRock[] {
  return Array.from({ length: SUNSET_ARCH.floatingRocks }, (_, i) => ({
    key: i,
    position: [Math.cos(i * 2.4) * (8 + (i % 3)), 15 + (i % 4), Math.sin(i * 2.4) * 2] as Vec3,
    rotation: [i, i * 0.4, i] as Vec3,
    radius: 0.35 + (i % 3) * 0.2,
  }));
}

export function hoverFloatingRocks(group: Object3D, t: number): void {
  group.position.y = Math.sin(t * 0.7) * 0.25;
  group.rotation.y = Math.sin(t * 0.2) * 0.04;
}

export function glowAt(age: number): number {
  return Math.max(0, 1 - age / SUNSET_ARCH.burstSeconds);
}

export function glyphOpacity(glow: number): number {
  return 0.15 + glow * 0.85;
}

export function placeArchParticles(mesh: InstancedMesh, dummy: Object3D, t: number, age: number, glow: number): void {
  for (let i = 0; i < SUNSET_ARCH.particles; i++) {
    const a = i * GOLDEN_ANGLE,
      r = 2 + age * 1.8 + (i % 5);
    dummy.position.set(Math.cos(a) * r, 3 + (i % 9) + age * 4, Math.sin(a) * r * 0.4);
    dummy.rotation.set(t, a, t * 0.7);
    dummy.scale.setScalar((0.05 + (i % 4) * 0.025) * glow);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function trackedPosition(previous: Vector3 | null, current: Vector3): Vector3 {
  return (previous ?? new Vector3()).copy(current);
}
