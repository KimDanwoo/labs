import {
  RING_Y,
  WATER_Y,
  dummy,
  lerp,
  lookTarget,
  maxDroplets,
  ringCount,
  splashIntensity,
} from '@views/ride/lib/runner/wadeSplash';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { WADE_SPLASH } from '@views/ride/model/runner/constants';
import { MeshBasicMaterial, type InstancedMesh, type Mesh } from 'three';

const MAX_FRAME_DELTA = 0.05;
const VECTOR_SIZE = 3;
const MIN_BURST = 0.6;
const SIDE_BASE = 0.4;
const SIDE_GAIN = 0.6;
const FADE_BASE = 0.55;
const FADE_GAIN = 0.45;
const RING_OPACITY_BASE = 0.5;
const RING_OPACITY_GAIN = 0.5;

export interface WadeState {
  position: Float32Array;
  velocity: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  size: Float32Array;
  ringAge: Float32Array;
  emitAccumulator: number;
  ringTimer: number;
  nextRing: number;
  lastLandedAt: number;
}

export function createWadeState(): WadeState {
  return {
    position: new Float32Array(maxDroplets * VECTOR_SIZE),
    velocity: new Float32Array(maxDroplets * VECTOR_SIZE),
    life: new Float32Array(maxDroplets),
    maxLife: new Float32Array(maxDroplets),
    size: new Float32Array(maxDroplets),
    ringAge: new Float32Array(ringCount).fill(Number.POSITIVE_INFINITY),
    emitAccumulator: 0,
    ringTimer: 0,
    nextRing: 0,
    lastLandedAt: runnerState.landedAt,
  };
}

export function createRingMaterials(): MeshBasicMaterial[] {
  return Array.from(
    { length: ringCount },
    () => new MeshBasicMaterial({ color: '#f4fafc', transparent: true, opacity: 0, depthWrite: false }),
  );
}

interface Emission {
  intensity: number;
  carry: number;
  dirX: number;
  dirZ: number;
}

function spawnDroplet(s: WadeState, i: number, emission: Emission): void {
  const p = i * VECTOR_SIZE;
  const origin = runnerState.position;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * WADE_SPLASH.spreadRadius;
  const burst = Math.max(emission.intensity, MIN_BURST);
  const side = Math.random() * WADE_SPLASH.sideSpeedMax * (SIDE_BASE + SIDE_GAIN * burst);
  s.position[p] = origin.x + Math.cos(angle) * radius;
  s.position[p + 1] = WATER_Y;
  s.position[p + 2] = origin.z + Math.sin(angle) * radius;
  s.velocity[p] = Math.cos(angle) * side + emission.dirX * emission.carry;
  s.velocity[p + 1] = lerp(WADE_SPLASH.upSpeedMin, WADE_SPLASH.upSpeedMax, Math.random() * burst);
  s.velocity[p + 2] = Math.sin(angle) * side + emission.dirZ * emission.carry;
  s.maxLife[i] = lerp(WADE_SPLASH.lifeMin, WADE_SPLASH.lifeMax, Math.random());
  s.life[i] = s.maxLife[i]!;
  s.size[i] = lerp(WADE_SPLASH.dropletMinSize, WADE_SPLASH.dropletMaxSize, Math.random());
}

function advanceDroplet(s: WadeState, i: number, delta: number): void {
  const p = i * VECTOR_SIZE;
  s.velocity[p + 1]! -= WADE_SPLASH.gravity * delta;
  s.position[p]! += s.velocity[p]! * delta;
  s.position[p + 1]! += s.velocity[p + 1]! * delta;
  s.position[p + 2]! += s.velocity[p + 2]! * delta;
  s.life[i]! -= delta;
  if (s.position[p + 1]! < WATER_Y) s.life[i] = 0;
}

function drawDroplet(s: WadeState, mesh: InstancedMesh, i: number): void {
  const p = i * VECTOR_SIZE;
  if (s.life[i]! <= 0) {
    dummy.scale.setScalar(0);
  } else {
    const fade = FADE_BASE + FADE_GAIN * (s.life[i]! / s.maxLife[i]!);
    const size = s.size[i]! * fade;
    const vx = s.velocity[p]!;
    const vy = s.velocity[p + 1]!;
    const vz = s.velocity[p + 2]!;
    const stretch = 1 + Math.sqrt(vx * vx + vy * vy + vz * vz) * WADE_SPLASH.stretchPerSpeed;
    dummy.position.set(s.position[p]!, s.position[p + 1]!, s.position[p + 2]!);
    lookTarget.set(s.position[p]! + vx, s.position[p + 1]! + vy, s.position[p + 2]! + vz);
    dummy.lookAt(lookTarget);
    dummy.scale.set(size, size, size * stretch);
  }
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

function accumulateEmission(s: WadeState, intensity: number, delta: number): void {
  s.emitAccumulator += WADE_SPLASH.emitPerSecond * intensity * delta;
  if (runnerState.landedAt !== s.lastLandedAt) {
    s.lastLandedAt = runnerState.landedAt;
    if (runnerState.waterDepth >= WADE_SPLASH.minDepth) {
      s.emitAccumulator += WADE_SPLASH.landingBurst;
      s.ringTimer = WADE_SPLASH.ringInterval;
    }
  }
  if (runnerState.waterDepth < WADE_SPLASH.minDepth) s.emitAccumulator = 0;
}

function stepDroplets(s: WadeState, mesh: InstancedMesh, emission: Emission, delta: number): void {
  for (let i = 0; i < maxDroplets; i += 1) {
    const isAlive = s.life[i]! > 0;
    if (!isAlive && s.emitAccumulator >= 1) {
      s.emitAccumulator -= 1;
      spawnDroplet(s, i, emission);
    } else if (isAlive) {
      advanceDroplet(s, i, delta);
    }
    drawDroplet(s, mesh, i);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function stepRings(
  s: WadeState,
  rings: (Mesh | null)[],
  materials: MeshBasicMaterial[],
  intensity: number,
  delta: number,
): void {
  const origin = runnerState.position;
  s.ringTimer += delta;
  const wantsRing = intensity > 0 || s.emitAccumulator >= WADE_SPLASH.landingBurst / 2;
  if (wantsRing && s.ringTimer >= WADE_SPLASH.ringInterval) {
    s.ringTimer = 0;
    const ring = rings[s.nextRing];
    if (ring) ring.position.set(origin.x, RING_Y, origin.z);
    s.ringAge[s.nextRing] = 0;
    s.nextRing = (s.nextRing + 1) % ringCount;
  }
  for (let i = 0; i < ringCount; i += 1) {
    const ring = rings[i];
    if (!ring) continue;
    s.ringAge[i]! += delta;
    const t = s.ringAge[i]! / WADE_SPLASH.ringLife;
    if (t >= 1) {
      ring.scale.setScalar(0);
      continue;
    }
    const eased = 1 - (1 - t) * (1 - t);
    ring.scale.setScalar(lerp(WADE_SPLASH.ringStartRadius, WADE_SPLASH.ringEndRadius, eased));
    materials[i]!.opacity = WADE_SPLASH.ringOpacity * (1 - t) * (RING_OPACITY_BASE + RING_OPACITY_GAIN * intensity);
  }
}

export function stepWadeSplash(
  s: WadeState,
  mesh: InstancedMesh,
  rings: { meshes: (Mesh | null)[]; materials: MeshBasicMaterial[] },
  rawDelta: number,
): void {
  const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
  const intensity = splashIntensity();
  const emission = {
    intensity,
    carry: runnerState.speed * WADE_SPLASH.forwardCarry,
    dirX: Math.sin(runnerState.heading),
    dirZ: Math.cos(runnerState.heading),
  };
  accumulateEmission(s, intensity, delta);
  stepDroplets(s, mesh, emission, delta);
  stepRings(s, rings.meshes, rings.materials, intensity, delta);
}
